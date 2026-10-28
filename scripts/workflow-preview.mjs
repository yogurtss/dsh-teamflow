/** Local interaction fixture: real React workbench and workflow reducer; simulated execution/model. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'tsdown';
import { applyWorkflowProposal, checkpointReady, decideCheckpoint, proposeWorkflow, workflowFingerprint, workflowState } from '../lib/workflow.js';
import { workflowMaterials } from '../lib/workflow-runtime.js';
import { prepareArchivedWorkflow } from '../lib/workflow-lifecycle.js';
import { assembleTeamSnapshot } from '../lib/snapshot.js';

const port = Number(process.env.TEAMFLOW_PREVIEW_PORT ?? 8371);
const directory = resolve('node_modules/workflow-ui');
mkdirSync(directory, { recursive: true });
writeFileSync(directory + '/entry.tsx', `import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkflowWorkbench } from '../../lib/client/WorkflowWorkbench.js';
import { TeamSection } from '../../lib/client/ActivityPanel.js';
import { zh } from '../../lib/client/locales.js';
import { WorkflowHistory } from '../../lib/client/WorkflowHistory.js';
import { getActivitySnapshotsSnapshot, subscribeActivitySnapshots } from '../../lib/client/activity-monitor.js';
const snapshot = { groups: [{ id: 'fixture', name: '测试提供方', models: [{ id: '模拟模型', name: '模拟模型', reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'low' } }, { id: '模拟模型 B', name: '模拟模型 B', reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'low' } }] }], failures: [], status: 'ready', current: null, pending: null, error: null };
const modelDirectory = { store: { subscribe: () => () => {}, getSnapshot: () => snapshot }, load: async () => {} } as any;
const t = ((key: string, values: Record<string, unknown> = {}) => (zh as Record<string, string>)[key]?.replace(/\\{(\\w+)\\}/g, (_, name) => String(values[name])) ?? key) as any;
const example = { workspace: '', teamId: 'preview', name: '活动面板示例', captainSessionId: 'preview', phase: 'running', workflowEnabled: true, messageCount: 0, captainInbox: [], members: [{ id: '', name: 'researcher', role: '需求分析师', provider: 'fixture', model: '模拟模型', activity: 'idle', progress: 0, done: 0, total: 1, currentTask: '', unread: 0 }], tasks: [{ id:'t1', subject:'需求调研', assignee:'researcher', status:'pending', state:'open', dependencies:[], depth:0 }] } as any;
const archived = {...example,name:'6/7 人工验收归档恢复示例',workflowEnabled:true,tasks:[...Array.from({length:6},(_,i)=>({id:'t'+(i+1),subject:'已完成成果 '+(i+1),status:'completed',state:'completed',assignee:'researcher',dependencies:[],depth:0})),{id:'t7',subject:'人工检查',status:'pending',state:'open',assignee:'',dependencies:['t1','t2','t3','t4','t5','t6'],depth:1,checkpoint:{round:1,history:[]}}]} as any;
function Preview() {const snapshots=React.useSyncExternalStore(subscribeActivitySnapshots,getActivitySnapshotsSnapshot);const restored=snapshots.teams.find(team=>team.teamId==='preview');
  if(${Boolean(process.env.TEAMFLOW_PREVIEW_ARCHIVED)}) return <><WorkflowWorkbench sessionId="preview" teamId="preview" archived={!restored} embeddedContext modelDirectory={modelDirectory} t={t}/><TeamSection team={restored??archived} workspace historic={!restored} modelDirectory={modelDirectory} onNavigate={()=>{}} t={t}/></>;
  return <><WorkflowWorkbench sessionId="preview" embeddedContext modelDirectory={modelDirectory} t={t} teamId={location.search.includes('blank') ? undefined : 'preview'} waitingCount={location.search.includes('blank') ? 0 : 1} /><TeamSection team={example} workspace modelDirectory={modelDirectory} onNavigate={() => {}} t={t} /></>}
createRoot(document.getElementById('root')!).render(<Preview/>);`);
writeFileSync(directory + '/config.mjs', `import base from '../../tsdown.config.ts';
const previewMenu = { name: 'preview-menu', resolveId(id) { if (id === '@deepseek-ai/dsh-client-ui-primitives') return '\\0preview-menu'; }, load(id) { if (id === '\\0preview-menu') return \`import React from 'react'; export function Modal() { return null; } export function Menu({anchor,open,items,onSelect}) { return React.createElement('div', null, anchor, open && React.createElement('div', {role:'menu'}, items.map(item => item.label && React.createElement('button',{key:item.id,type:'button',role:'menuitem',disabled:item.disabled,onClick:()=>onSelect(item.id)},item.label)))); }\`; } };
export default { ...base, plugins:[previewMenu, ...base.plugins], name:'workflow-preview', entry:[${JSON.stringify(directory + '/entry.tsx')}], outDir:${JSON.stringify(directory)}, format:'iife', sourcemap:false, deps:{alwaysBundle:()=>true}, outputOptions:{entryFileNames:'app.js'} };`);
await build({ config: directory + '/config.mjs' });
let team = {
  id: 'preview', name: '长链路协作 · 人工验收示例', captainSessionId: 'preview', description: '完成需求调研，通过人工检查后实现与发布。', phase: process.env.TEAMFLOW_PREVIEW_STAGED ? 'staged' : 'running', taskSeq: 3, createdAt: 1,
  members: [{ id: '', name: 'researcher', summary: '梳理需求与风险，交付调研报告。', role: '需求分析师', executionPrompt: '核对证据并注明不确定项。', provider: 'fixture', model: '模拟模型', joinedAt: 1, status: 'idle' }, { id: '', name: 'developer', summary: '实现已确认方案，交付代码和测试结果。', role: '工程实现', provider: 'fixture', model: '模拟模型', joinedAt: 1, status: 'idle' }],
  tasks: [
    { id: 't1', subject: '需求调研', description: '明确范围、风险与验收标准', assignee: 'researcher', dependencies: [], status: 'completed', output: '已整理三项需求：成员职责可调整、画布编排、人工审批。需要确认返工边界。', attempt: 1, createdAt: 1, updatedAt: 1 },
    { id: 't2', subject: '需求人工验收', description: '共同确认需求与验收标准', dependencies: ['t1'], status: 'pending', checkpoint: { round: 1, history: [] }, attempt: 0, createdAt: 1, updatedAt: 1 },
    { id: 't3', subject: '开发与自测', description: '仅在需求通过后执行', assignee: 'developer', dependencies: ['t2'], status: 'pending', attempt: 0, createdAt: 1, updatedAt: 1 },
  ],
};
if(process.env.TEAMFLOW_PREVIEW_ARCHIVED) {
  team.name='6/7 人工验收归档恢复示例';team.phase='running';team.taskSeq=7
  team.tasks=[...Array.from({length:6},(_,i)=>({id:'t'+(i+1),subject:'已完成成果 '+(i+1),assignee:'researcher',dependencies:[],status:'completed',output:'第 '+(i+1)+' 项成果已提交。',attempt:1,createdAt:1,updatedAt:1})),{id:'t7',subject:'人工检查',description:'核对六项成果并由用户批准。',dependencies:['t1','t2','t3','t4','t5','t6'],status:'pending',checkpoint:{round:1,history:[]},attempt:0,createdAt:1,updatedAt:1}]
  team.members.forEach(member=>{member.status='removed'});workflowState(team)
}
if (process.env.TEAMFLOW_PREVIEW_RERUN) {
  decideCheckpoint(team,'t2','approve','fixture','fixture','模拟已通过')
  Object.assign(team.tasks[2],{status:'completed',attempt:1,output:'模拟已完成的实现结果'})
  team.tasks.push({id:'t4',subject:'独立文档整理',assignee:'developer',dependencies:[],status:'completed',attempt:1,output:'独立分支结果保持不变',createdAt:1,updatedAt:1}); team.taskSeq=4
}
if (process.env.TEAMFLOW_PREVIEW_DISCUSSION && !process.env.TEAMFLOW_PREVIEW_ARCHIVED) {
  const key = 'member:researcher'
  workflowState(team).discussions[`discussion:${key}`] = { key, messages: [], calls: [], proposal: proposeWorkflow(team, '调整研究成员职责', [{ action: 'update_member', name: 'researcher', summary: '整理需求并明确每项验收标准。', role: '需求与验收分析师' }]) }
}
const send = (res, status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
const transcripts = new Map();
function previewMessages(key) {
  if (!transcripts.has(key)) {
    const task=key.startsWith('task:') && team.tasks.find(task=>task.id===key.slice(5));
    transcripts.set(key,[{id:'1',role:'assistant',text:task ? `这是任务讨论的模拟回复。当前任务：${task.subject}；已保存要求：${task.description || '尚未填写'}。可以讨论要求、上下游或已有结果，修改需确认后生效。` : `这是 ${key} 独立讨论的模拟回复。你希望重点调整什么？`}]);
  }
  return transcripts.get(key);
}
createServer(async (req, res) => {
  if (req.url === '/app.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(readFileSync(directory + '/app.js')); return; }
  if (req.method !== 'POST') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!doctype html><html lang="zh" style="color-scheme:' + (req.url.includes('dark') ? 'dark' : 'light') + '"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AgentTeams 工作台交互验证</title></head><body style="font-family:system-ui;padding:30px;background:light-dark(#f6f7f9,#181a1e);color:light-dark(#26303d,#e3e6ec)"><h2>AgentTeams 工作台 · 开发预览</h2><p>本页使用实际界面代码，执行结果为模拟数据；原生讨论入口需要在 DSH 中使用。</p><div id="root"></div><script src="/app.js"></script></body></html>'); return; }
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw), key = body.discussion || 'graph';
    const messages = previewMessages(key);
    if (body.action === 'edit' && process.env.TEAMFLOW_PREVIEW_EDIT_DELAY_MS) await new Promise(resolve => setTimeout(resolve, Number(process.env.TEAMFLOW_PREVIEW_EDIT_DELAY_MS)));
    if (process.env.TEAMFLOW_PREVIEW_DISCUSSION && body.action === 'conversation_state') { send(res, 200, { messages, busy: false }); return; }
    if (process.env.TEAMFLOW_PREVIEW_DISCUSSION && body.action === 'conversation_send') { if (process.env.TEAMFLOW_PREVIEW_SEND_DELAY_MS) await new Promise(resolve => setTimeout(resolve, Number(process.env.TEAMFLOW_PREVIEW_SEND_DELAY_MS))); messages.push({ id: String(messages.length + 1), role: 'user', text: body.message }, { id: String(messages.length + 2), role: 'assistant', text: '这是模拟回复，正式环境将由独立 DSH 会话生成。' }); send(res, 200, { messages, busy: false }); return; }
    if (body.action === 'create') team = { id: 'preview', name: body.name, description: body.description, captainSessionId: 'preview', phase: 'staged', members: [], tasks: [], taskSeq: 0, createdAt: 1 };
    const state = workflowState(team), slot = `discussion:${key}`;
    if(body.action==='restore_archive') team=prepareArchivedWorkflow(team);
    const discussion = state.discussions[slot] ??= { key, messages: [], calls: [] };
    if (body.action === 'preview') discussion.proposal = proposeWorkflow(team, body.title, body.operations);
    if (body.action === 'edit') { if (body.base !== workflowFingerprint(team)) throw Error('团队已变化'); const oldIds = team.tasks.map(task => task.id); team = applyWorkflowProposal(team, proposeWorkflow(team, body.title, body.operations)); if (body.positions) { const layout = workflowState(team).positions; for (const [id, point] of Object.entries(body.positions)) if (team.tasks.some(task => task.id === id)) layout[`task:${id}`] = point; for (const task of team.tasks) if (!oldIds.includes(task.id)) { layout[`task:${task.id}`] = { x: 32, y: Math.max(0, ...Object.values(layout).map(point => point.y)) + 160 }; if (!task.checkpoint && team.phase !== 'staged') task.workflowPaused = true; } } }
    if (body.action === 'apply') {
      if (!discussion.proposal || discussion.proposal.id !== body.proposalId) throw new Error('提案已替换');
      const proposal = body.operations ? { ...discussion.proposal, suggestedOperations: discussion.proposal.operations, operations: body.operations } : discussion.proposal;
      team = applyWorkflowProposal(team, proposal);
    }
    if (body.action === 'resume_task') {
      const task=team.tasks.find(task=>task.id===body.taskId)
      if(task?.workflowConfigPending) throw Error('请先填写任务／验收要求并完成节点配置')
      if(!task?.workflowPaused || task.status!=='pending') throw Error('节点没有挂起')
      if(task.workflowRerunRequired && task.dependencies.some(id=>team.tasks.find(item=>item.id===id)?.status!=='completed')) throw Error('请先等待所有上游任务完成')
      task.workflowPaused=false;task.workflowRerunRequired=false
    }
    // Explicit fixture mode: simulate successful work; never calls a real model.
    if (process.env.TEAMFLOW_PREVIEW_RERUN) for(const task of team.tasks) if(task.status==='pending' && !task.checkpoint && !task.workflowPaused && task.dependencies.every(id=>team.tasks.find(item=>item.id===id)?.status==='completed')) {task.status='completed';task.attempt=(task.attempt??0)+1;task.output='模拟重跑结果：已按最新要求重新执行。'}
    if (body.action === 'dismiss' && discussion.proposal) discussion.proposal.status = 'dismissed';
    if (body.action === 'layout') for (const [id, point] of Object.entries(body.positions ?? { [body.taskId]: { x: body.x, y: body.y } })) state.positions[`task:${id}`] = point;
    if (body.action === 'start') team.phase = 'running';
    if (body.action === 'new_discussion') state.discussions[slot] = { key, messages: [], calls: [] };
    if (body.action === 'materials' && key.startsWith('check:')) {
      const task=team.tasks.find(t=>t.id===key.slice(6)), material=workflowMaterials(team,task.id,process.cwd());
      discussion.materials=material.text; discussion.evidence=material.evidence; discussion.materialsRound=task.checkpoint.round;
    }
    if (body.action === 'open_discussion') {
      if (!process.env.TEAMFLOW_PREVIEW_DISCUSSION) throw new Error('此开发预览不包含 DSH 原生会话，请在真实宿主中使用此入口。');
      if(body.fresh) {transcripts.delete(key);discussion.proposal=undefined;}
      discussion.native = { sessionId: `session-at-discussion-preview-${key}`, label: key };
    }
    if (body.action === 'review') decideCheckpoint(team, body.taskId, body.decision, body.evidence, workflowMaterials(team, body.taskId, process.cwd()).evidence, body.note || '');
    send(res, 200, { team, base: workflowFingerprint(team), ...(['restore_archive','review'].includes(body.action)?{activity:await assembleTeamSnapshot({agents:{get(){}}},resolve('node_modules/workflow-preview-state'),'测试',team)}:{}), ready: body.action === 'archive_state' ? [] : team.tasks.filter(t => checkpointReady(team, t) && !t.checkpoint.decision).map(t => t.id), busy: [], ...(process.env.TEAMFLOW_PREVIEW_DISCUSSION ? { currentDiscussion: 'member:researcher' } : {}), ...(body.action === 'open_discussion' ? { openedSessionId: discussion.native.sessionId } : {}) });
  } catch (error) { send(res, 409, { error: error.message }); }
}).listen(port, '127.0.0.1', () => console.log(`Workflow UI fixture: http://127.0.0.1:${port}`));
