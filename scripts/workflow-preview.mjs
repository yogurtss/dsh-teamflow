/** Local interaction fixture: real React workbench and workflow reducer; simulated execution/model. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'tsdown';
import { applyWorkflowProposal, checkpointReady, decideCheckpoint, proposeWorkflow, workflowFingerprint, workflowState } from '../lib/workflow.js';
import { workflowMaterials } from '../lib/workflow-runtime.js';

const port = Number(process.env.TEAMFLOW_PREVIEW_PORT ?? 8371);
const directory = resolve('node_modules/workflow-ui');
mkdirSync(directory, { recursive: true });
writeFileSync(directory + '/entry.tsx', `import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkflowWorkbench } from '../../lib/client/WorkflowWorkbench.js';
import { zh } from '../../lib/client/locales.js';
const snapshot = { groups: [{ id: 'fixture', name: '测试提供方', models: [{ id: '模拟模型', name: '模拟模型', reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'low' } }, { id: '模拟模型 B', name: '模拟模型 B', reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'low' } }] }], failures: [], status: 'ready', current: null, pending: null, error: null };
const modelDirectory = { store: { subscribe: () => () => {}, getSnapshot: () => snapshot }, load: async () => {} } as any;
const t = ((key: string, values: Record<string, unknown> = {}) => (zh as Record<string, string>)[key]?.replace(/\\{(\\w+)\\}/g, (_, name) => String(values[name])) ?? key) as any;
createRoot(document.getElementById('root')!).render(<WorkflowWorkbench sessionId="preview" embeddedContext modelDirectory={modelDirectory} t={t} teamId={location.search.includes('blank') ? undefined : 'preview'} waitingCount={location.search.includes('blank') ? 0 : 1} />);`);
writeFileSync(directory + '/config.mjs', `import base from '../../tsdown.config.ts';
const previewMenu = { name: 'preview-menu', resolveId(id) { if (id === '@deepseek-ai/dsh-client-ui-primitives') return '\\0preview-menu'; }, load(id) { if (id === '\\0preview-menu') return \`import React from 'react'; export function Menu({anchor,open,items,onSelect}) { return React.createElement('div', null, anchor, open && React.createElement('div', {role:'menu'}, items.map(item => item.label && React.createElement('button',{key:item.id,type:'button',role:'menuitem',disabled:item.disabled,onClick:()=>onSelect(item.id)},item.label)))); }\`; } };
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
const send = (res, status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
createServer(async (req, res) => {
  if (req.url === '/app.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(readFileSync(directory + '/app.js')); return; }
  if (req.method !== 'POST') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!doctype html><html lang="zh" style="color-scheme:' + (req.url.includes('dark') ? 'dark' : 'light') + '"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AgentTeams 工作台交互验证</title></head><body style="font-family:system-ui;padding:30px;background:light-dark(#f6f7f9,#181a1e);color:light-dark(#26303d,#e3e6ec)"><h2>AgentTeams 工作台 · 开发预览</h2><p>本页使用实际界面代码，执行结果为模拟数据；原生讨论入口需要在 DSH 中使用。</p><div id="root"></div><script src="/app.js"></script></body></html>'); return; }
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw), key = body.discussion || 'graph';
    if (body.action === 'create') team = { id: 'preview', name: body.name, description: body.description, captainSessionId: 'preview', phase: 'staged', members: [], tasks: [], taskSeq: 0, createdAt: 1 };
    const state = workflowState(team), slot = `discussion:${key}`;
    const discussion = state.discussions[slot] ??= { key, messages: [], calls: [] };
    if (body.action === 'preview') discussion.proposal = proposeWorkflow(team, body.title, body.operations);
    if (body.action === 'edit') { if (body.base !== workflowFingerprint(team)) throw Error('团队已变化'); const oldIds = team.tasks.map(task => task.id); team = applyWorkflowProposal(team, proposeWorkflow(team, body.title, body.operations)); if (body.positions) { const layout = workflowState(team).positions; for (const [id, point] of Object.entries(body.positions)) if (team.tasks.some(task => task.id === id)) layout[`task:${id}`] = point; for (const task of team.tasks) if (!oldIds.includes(task.id)) { layout[`task:${task.id}`] = { x: 32, y: Math.max(0, ...Object.values(layout).map(point => point.y)) + 160 }; if (!task.checkpoint && team.phase !== 'staged') task.workflowPaused = true; } } }
    if (body.action === 'apply') team = applyWorkflowProposal(team, discussion.proposal);
    if (body.action === 'dismiss' && discussion.proposal) discussion.proposal.status = 'dismissed';
    if (body.action === 'layout') state.positions[`task:${body.taskId}`] = { x: body.x, y: body.y };
    if (body.action === 'start') team.phase = 'running';
    if (body.action === 'new_discussion') state.discussions[slot] = { key, messages: [], calls: [] };
    if (body.action === 'materials' && key.startsWith('check:')) {
      const task=team.tasks.find(t=>t.id===key.slice(6)), material=workflowMaterials(team,task.id,process.cwd());
      discussion.materials=material.text; discussion.evidence=material.evidence; discussion.materialsRound=task.checkpoint.round;
    }
    if (body.action === 'open_discussion') throw new Error('此开发预览不包含 DSH 原生会话，请在真实宿主中使用此入口。');
    if (body.action === 'review') decideCheckpoint(team, body.taskId, body.decision, body.evidence, workflowMaterials(team, body.taskId, process.cwd()).evidence, body.note || '');
    send(res, 200, { team, base: workflowFingerprint(team), ready: team.tasks.filter(t => checkpointReady(team, t) && !t.checkpoint.decision).map(t => t.id), busy: [] });
  } catch (error) { send(res, 409, { error: error.message }); }
}).listen(port, '127.0.0.1', () => console.log(`Workflow UI fixture: http://127.0.0.1:${port}`));
