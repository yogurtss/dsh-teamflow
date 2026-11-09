/** Real workbench + HTTP reducer/persistence/scheduler. Only execution/model outputs are simulated. */
import { createServer } from 'node:http'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { build } from 'tsdown'
import { createTeamDir, readTeam, withTeamLock, writeTeam } from '../lib/state.js'
import { installWorkflowWorkbench } from '../lib/workflow-runtime.js'
import { installTeamScheduler } from '../lib/scheduler.js'
import { decideLoop, loopInputFingerprint } from '../lib/workflow-loops.js'
import { getBuiltinTemplate } from '../lib/builtin-templates.js'
import { instantiateTemplate } from '../lib/templates.js'

const port = Number(process.env.TEAMFLOW_LOOP_PORT ?? 8384)
const bundle = resolve('node_modules/loop-ui')
await mkdir(bundle, { recursive: true }); await mkdir('output', { recursive: true })
const workspace = await mkdtemp(resolve('output/loop-preview-')), root = join(workspace, '.agent-teams')
writeFileSync(join(bundle, 'entry.tsx'), `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {WorkflowWorkbench} from '../../lib/client/WorkflowWorkbench.js';import {en,zh} from '../../lib/client/locales.js';
function App(){const [language,setLanguage]=useState('zh');const t=key=>(language==='en'?en:zh)[key]??key;return <><select aria-label="Preview language" style={{position:'fixed',right:12,top:8,zIndex:2147483647}} value={language} onChange={e=>setLanguage(e.target.value)}><option value="zh">中文</option><option value="en">English</option></select><WorkflowWorkbench sessionId="captain" teamId="demo" initiallyOpen embeddedContext t={t}/></>};createRoot(document.getElementById('root')!).render(<App/>);`)
writeFileSync(join(bundle, 'config.mjs'), `import base from '../../tsdown.config.ts';const menu={name:'preview-menu',resolveId(id){if(id==='@deepseek-ai/dsh-client-ui-primitives')return '\\0preview-menu'},load(id){if(id==='\\0preview-menu')return "import React from 'react';export function Modal(){return null}export function Menu({anchor}){return anchor}"}};export default {...base,plugins:[menu,...base.plugins],name:'loop-preview',entry:['${bundle.replaceAll('\\','/')}/entry.tsx'],outDir:'${bundle.replaceAll('\\','/')}',format:'iife',sourcemap:false,deps:{alwaysBundle:()=>true},outputOptions:{entryFileNames:'app.js'}}`)
await build({ config: join(bundle, 'config.mjs') })
const task = (id, subject, dependencies = [], checkpoint = false) => ({ id, subject, description: `完成并验证：${subject}`, dependencies, assignee: checkpoint ? undefined : 'worker', kind: 'work', status: 'pending', attempt: 0, createdAt: 1, updatedAt: 1,
  workflowPaused: true, workflowAwaitingStart: true, ...(checkpoint ? { checkpoint: { round: 1, history: [] } } : {}) })
await createTeamDir(root, process.env.TEAMFLOW_PREVIEW_TEMPLATE ? instantiateTemplate(getBuiltinTemplate(process.env.TEAMFLOW_PREVIEW_TEMPLATE), 'demo', 'captain', '循环模板布局验证', '检查多步骤循环与两条门控路径') : { id: 'demo', name: '门控循环验证', description: '保留原节点，多轮改进并审核', captainSessionId: 'captain', phase: 'running', createdAt: 1, taskSeq: 4,
  members: ['worker','reviewer'].map(name => ({ name, id: name, summary: name === 'worker' ? '实现与验证' : '独立审核', status: 'idle', joinedAt: 1 })),
  tasks: [task('a','方案'),task('b','实现与验证',['a']),task('gate',process.env.TEAMFLOW_GATE_TITLE ?? '交付门控',['b'],true),task('after','最终交付',['gate'])], workflow: { explicitQuality: true, positions: {}, discussions: {}, history: [] } })
const live = new Map(['captain','worker','reviewer'].map(id => [id,{id,status:'idle',session:{header:{id,cwd:workspace},ownEvents:()=>[]}}]))
const cleanups = [], timers = new Set(); let route
const ctx = { agents: { get: id => live.get(id) }, effect: fn => cleanups.push(fn()), on: () => () => {}, logger: { warn: console.warn, debug() {} }, subagents: { drainChildren: async () => {} } }
let scheduler
scheduler = installTeamScheduler(ctx, { stateDir: '.agent-teams', dispatch: async (_captain, teamId, memberName, _text, _signal, _mode, attemptId) => {
  live.get(memberName).status = 'running'
  const timer = setTimeout(async () => {
    timers.delete(timer)
    try {
      await withTeamLock(`team:${root}:${teamId}`, async () => {
        const team = await readTeam(root, teamId), task = team.tasks.find(t => t.attemptId === attemptId)
        if (!task || task.workflowPaused) return
        const loop = team.workflow.loops?.find(l => l.gateId === task.id)
        if (loop) decideLoop(team, loop.id, { decisionId: crypto.randomUUID(), runId: loop.runId, round: loop.round, fingerprint: loopInputFingerprint(team, loop), decision: loop.round < 3 ? 'revise' : 'pass', note: loop.round < 3 ? `第 ${loop.round} 轮：补齐边界检查，并重新验证输入范围。` : '所有边界验证已通过，可以交付。', taskIds: loop.round < 3 ? ['b'] : [] }, 'ai:reviewer')
        else { task.status = 'completed'; task.output = `第 ${team.workflow.loops?.[0]?.round ?? 1} 轮 · ${task.subject}\n已完成实现，验证边界条件。`; task.commandsRun = [{ command: 'node --test', status: 'passed', exitCode: 0, evidence: 'Fixture: 8 checks passed' }]; task.updatedAt = Date.now() }
        await writeTeam(root, team)
      })
    } catch (error) { console.error(error) } finally { live.get(memberName).status = 'idle' }
    await scheduler.kickTeam(workspace, teamId, live.get('captain'))
  }, 200)
  timers.add(timer); return true
} })
installWorkflowWorkbench(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, scheduler, { register: value => { route = value; return () => {} } })
const server = createServer((req, res) => {
  if (req.url === '/plugins/dsh-agent-teams/workflow') { void route.handler(req, res); return }
  if (req.url === '/app.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(readFileSync(join(bundle, 'app.js'))); return }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui;background:#f5f6f8;color:#17202a}button,select,input,textarea{font:inherit}button{cursor:pointer;padding:7px 10px}button:disabled{cursor:default;opacity:.5}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>')
})
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ url: `http://127.0.0.1:${port}`, workspace })))
function close() { timers.forEach(clearTimeout); cleanups.forEach(fn => typeof fn === 'function' && fn()); server.close(); process.exit(0) }
process.on('SIGTERM', close); process.on('SIGINT', close)
