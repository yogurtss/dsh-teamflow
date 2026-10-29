import test from 'node:test'
import assert from 'node:assert/strict'
import { awaitsFirstStart } from '../lib/task-start-state.js'
import { isTeamTask } from '../lib/state.js'
import { taskReadiness } from '../lib/client/task-readiness.js'
import { isWorkflowRerunContext } from '../lib/workflow-validation.js'
import { taskControlState, taskPlaybackDisabled } from '../lib/client/task-control.js'

test('drafts prevent starting stale work but never prevent pausing or retrying a stop',()=>{
  const task={id:'t1',status:'in_progress',dependencies:[]}, team={tasks:[task],phase:'running'}
  assert.equal(taskPlaybackDisabled(taskControlState(team,task),false,true),false)
  assert.equal(taskPlaybackDisabled(taskControlState(team,{...task,workflowPaused:true}),false,true),false)
  assert.equal(taskPlaybackDisabled(taskControlState(team,{...task,status:'pending'}),false,true),false)
  assert.equal(taskPlaybackDisabled(taskControlState(team,{...task,status:'pending',workflowPaused:true}),false,true),true)
  assert.equal(taskPlaybackDisabled(taskControlState(team,task),true,false),true)
  assert.equal(taskPlaybackDisabled(taskControlState(team,{...task,status:'completed'}),false,false),true)
})

test('rerun context survives persistence and rejects malformed saved requirements or result types',()=>{
  const context={instructions:'Use the prior result',previousStatus:'completed',previousOutput:'Result',previousAttemptId:'old',requestedAt:1}
  assert.equal(isWorkflowRerunContext(JSON.parse(JSON.stringify(context))),true)
  for(const patch of [{instructions:''},{instructions:42},{previousStatus:'in_progress'},{previousOutput:{}},{requestedAt:'now'}]) assert.equal(isWorkflowRerunContext({...context,...patch}),false)
})

test('first-start intent survives saved state and distinguishes legacy drafts from execution stops',()=>{
  const task={id:'new',subject:'New task',kind:'work',status:'pending',dependencies:[],attempt:0,createdAt:1,updatedAt:1,workflowPaused:true,workflowAwaitingStart:true}
  assert.equal(isTeamTask(JSON.parse(JSON.stringify(task))),true)
  assert.equal(isTeamTask({...task,workflowAwaitingStart:'yes'}),false)
  assert.equal(awaitsFirstStart(task),true)
  const team={phase:'running',tasks:[task],members:[]}
  assert.equal(taskReadiness(team,task).label,'待启动')
  assert.equal(taskReadiness(team,{...task,workflowConfigPending:true}).label,'待配置')
  const legacy={...task};delete legacy.workflowAwaitingStart
  assert.equal(awaitsFirstStart(legacy),true)
  for(const patch of [{workflowAwaitingStart:false},{attempt:1},{attemptId:'run'},{handoffId:'stop'},{stoppedAttempts:[{at:1}]},{checkpoint:{round:1,history:[]}},{workflowRerunRequired:true},{status:'in_progress'},{workflowPaused:false}]) {
    assert.equal(awaitsFirstStart({...legacy,...patch}),false,JSON.stringify(patch))
  }
})
