import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { en, zh } from '../lib/client/locales.js'

// Render the production component; only unrelated host UI and CSS imports are stubbed.
const hook = registerHooks({ resolve(specifier, context, next) {
  let source
  if (specifier.endsWith('.module.css')) source = 'export default new Proxy({}, {get: (_, key) => key})'
  if (context.parentURL?.endsWith('/client/WorkflowWorkbench.js') && specifier === './StagingPlanEditor.js') source = 'export const StagedModelPicker = () => null'
  if (context.parentURL?.endsWith('/client/ActivityPanel.js')) {
    if (specifier === '@deepseek-ai/dsh-client-ui-primitives') source = 'export const Modal = () => null'
    if (specifier === './AgentTeamsCard.js') source = 'export const OPEN_PANEL_EVENT = "test-open"'
    if (specifier === './StagingPlanEditor.js') source = 'export const StagingPlanEditor = () => null'
    if (specifier === './QuickMemberEditor.js') source = 'export const QuickMemberEditor = () => null'
  }
  return source === undefined ? next(specifier, context) : { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true }
} })
const { TeamSection } = await import('../lib/client/ActivityPanel.js')
const { TaskRecord } = await import('../lib/client/WorkflowContext.js')
const { taskControlState } = await import('../lib/client/task-control.js')
hook.deregister()
const base = { workspace: '', teamId: 'summary', name: 'Summary', captainSessionId: 'captain', phase: 'running', members: [], tasks: [], messageCount: 0, captainInbox: [] }
const task = (id, status, state = status) => ({ id, subject: id, status, state, assignee: '', dependencies: [], depth: 0 })
const render = (team, dict, extra = {}) => renderToStaticMarkup(React.createElement(TeamSection, {
  team, workspace: true, onNavigate() {}, t: (key, values = {}) => dict[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name])), ...extra,
}))

test('compact dependency cards distinguish human reviews and put controls in the selected detail',()=>{
  const tasks=[{...task('up','pending','open'),workflowPaused:true},{...task('review','pending','blocked'),checkpoint:{round:2,history:[]},dependencies:['up']},{...task('down','pending','blocked'),dependencies:['review']},task('done','completed')]
  const team={...base,tasks}
  const html=render(team,zh)
  assert.match(html,/data-checkpoint="true"/);assert.ok(html.includes('人工审核'));assert.ok(html.includes('第 2 轮'))
  assert.doesNotMatch(html,/role="switch"/)
  assert.match(html,/data-task-action="pause"[^>]*aria-label="暂停 · review"/)
  assert.match(html,/width:164px;height:76px/)
  assert.ok(html.includes('已启用 · 等待上游'));assert.ok(!html.includes('data-review-action="true"'))
  const waiting=taskControlState(team,tasks[2]);assert.equal(waiting.checked,true);assert.deepEqual(waiting.waiting,['review'])
  assert.equal(taskControlState(team,tasks[1]).reviewReady,false)
  tasks[0].status='completed';assert.equal(taskControlState(team,tasks[1]).reviewReady,true)
  assert.ok(render({...team,tasks:[tasks[0],tasks[1]]},en).includes('Start review'))
  assert.equal(taskControlState(team,{...tasks[1],workflowPaused:true}).reviewReady,false)
  assert.equal(taskControlState(team,{...tasks[1],workflowConfigPending:true}).disabled,true)
  assert.equal(taskControlState(team,{...tasks[2],workflowRerunRequired:true}).disabled,true)
  assert.equal(taskControlState({...team,phase:'staged'},tasks[1]).reviewReady,false)
  assert.equal(taskControlState(team,tasks[1],true).disabled,true)
  const draining=taskControlState(team,{...tasks[2],status:'in_progress',workflowPaused:true})
  assert.equal(draining.stopping,true);assert.equal(draining.label,'task.control.stopping')
})

test('completed, cancelled and failed execution tasks expose rerun instead of a disabled switch',()=>{
  for (const status of ['completed','cancelled','failed']) {
    const item=task('terminal',status), team={...base,tasks:[item]}
    for(const dict of [zh,en]) {
      const html=render(team,dict)
      assert.ok(html.includes(dict['task.control.rerun']))
      assert.match(html,/data-rerun-action="true"/)
      assert.match(html,/data-task-action="rerun"[^>]*data-rerun-action="true"[^>]*class="taskPlayback"(?![^>]*disabled)/)
      assert.doesNotMatch(html,/role="switch"/)
    }
    assert.equal(taskControlState(team,item).canRerun,true)
    assert.equal(taskControlState(team,item,true).canRerun,false)
    assert.equal(taskControlState({...team,halted:true},item).canRerun,false)
    assert.equal(taskControlState({...team,phase:'staged'},item).canRerun,false)
    assert.equal(taskControlState(team,{...item,checkpoint:{round:1,history:[],decision:'approve'}}).canRerun,false)
  }
})

test('running dependency cards keep the animated work glyph, idle cards do not',()=>{
  const html=render({...base,tasks:[task('running','in_progress','running'),task('waiting','pending','open')]},zh)
  assert.equal((html.match(/class="dagRunningState"/g)||[]).length,1)
  assert.match(html,/class="workGlyph"[^>]*data-active="true"/)
  assert.match(html,/data-task-action="pause"[^>]*data-running="true"/)
  const paused=render({...base,tasks:[{...task('paused','pending','open'),workflowPaused:true}]},zh)
  assert.match(paused,/data-task-action="play"[^>]*aria-label="开始 · paused"/)
})

test('finished canvas task details expose submitted results and verification records without starting work',()=>{
  const finished={...task('done','completed'),subject:'Finished task',description:'Original requirements',objective:'Goal',acceptance:['Criterion'],verify:['run tests'],output:'Delivered result',commandsRun:[{command:'test command',status:'passed',evidence:'verification evidence'}],acceptanceResults:[{criterion:'Criterion',status:'passed',evidence:'acceptance evidence'}]}
  const html=renderToStaticMarkup(React.createElement(TaskRecord,{task:finished,team:{tasks:[finished]},expanded:true}))
  assert.match(html,/<details[^>]*open=""/)
  for(const text of ['Original requirements','Goal','Criterion','run tests','Delivered result','verification evidence','acceptance evidence']) assert.ok(html.includes(text))
})

for (const dict of [en, zh]) test(`workspace completion preserves lifecycle and stale-verdict warnings (${dict === en ? 'en' : 'zh'})`, () => {
  const team = { ...base, tasks: [task('done', 'completed'), task('failed', 'failed'), task('cancelled', 'cancelled'), task('claimed', 'claimed'), task('running', 'in_progress', 'running')] }
  assert.match(render(team, dict), /data-completed="1" data-total="5"/)
  assert.match(render(base, dict), /stroke-dasharray="0 100"/)
  assert.match(render({ ...team, phase: 'staged' }, dict, { historic: true }), /data-completed="0" data-total="5"/)
  const stale = render({ ...base, tasks: [{ ...task('audit', 'completed'), verdict: 'pass', verdictStale: 'workspace content changed' }] }, dict)
  const summary = stale.slice(stale.indexOf('class="completionTasks"'), stale.indexOf('class="inboxCard"'))
  assert.match(summary, /data-verdict-stale="true"/)
  assert.match(summary, /workspace content changed/)
  assert.ok(summary.includes(dict['workspace.verdictStale']))
  assert.doesNotMatch(summary, />✓</)
  assert.match(stale, /data-completed="1" data-total="1"/, 'the warning must not rewrite durable task completion')
})

test('inbox renders unread snapshot content safely and keeps scroll regions keyboard reachable', () => {
  const html = render({ ...base, tasks: [task('t1', 'completed')], captainInbox: [{ from: '<script>sender</script>', content: '<img src=x onerror=alert(1)>\nreport' }] }, en)
  assert.match(html, /&lt;script&gt;sender&lt;\/script&gt;/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.match(html, /class="inboxMessages" tabindex="0" aria-label="Captain inbox"/)
  assert.match(html, /class="completionTasks" tabindex="0" aria-label="Task completion summary"/)
  assert.ok(html.includes(en['workspace.inboxHint']))
  assert.doesNotMatch(render(base, en, { workspace: false }), /class="workspaceSummary"/)
})

for(const dict of [zh,en]) test(`human checkpoints use review labels and approval updates the progress (${dict===zh?'zh':'en'})`,()=>{
  const tasks=Array.from({length:6},(_,i)=>task(`done-${i}`,'completed'))
  tasks.push({...task('human','pending','open'),checkpoint:{round:1,history:[]},dependencies:tasks.map(t=>t.id)})
  const html=render({...base,tasks},dict)
  assert.match(html,/data-completed="6" data-total="7"/)
  assert.ok(html.includes(dict['task.status.reviewReady']));assert.ok(!html.includes(dict['task.summary.ready'].replace('{tasks}','human')))
  assert.ok(!html.includes(dict['task.detail.ready']))
  const unconfigured=render({...base,tasks:tasks.map(item=>item.id==='human'?{...item,workflowConfigPending:true,workflowPaused:true,state:'blocked'}:item)},dict)
  assert.ok(unconfigured.includes(dict['task.status.configurationPending']))
  assert.ok(!unconfigured.includes(dict['task.status.reviewReady']))
  tasks.at(-1).status='completed';tasks.at(-1).state='completed';tasks.at(-1).checkpoint.decision='approve'
  const approved=render({...base,tasks},dict)
  assert.match(approved,/data-completed="7" data-total="7"/);assert.ok(approved.includes(dict['task.status.reviewPassed']))
})
