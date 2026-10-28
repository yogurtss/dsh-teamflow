import test from 'node:test'
import assert from 'node:assert/strict'
import { awaitsFirstStart } from '../lib/task-start-state.js'
import { isTeamTask } from '../lib/state.js'
import { taskReadiness } from '../lib/client/task-readiness.js'

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
