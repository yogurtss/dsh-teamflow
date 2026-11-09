import test from 'node:test'
import assert from 'node:assert/strict'
import { adaptationPhase, adaptationLabels } from '../lib/client/adaptation-progress.js'
import { workflowEnglish } from '../lib/client/workflow-messages.js'
const state = {opening:false,busy:false,disconnected:false,error:false,hasSession:false,base:'current'}
test('adaptation status distinguishes progress, uncertain completion and stale proposals',()=>{
 const proposal={status:'pending',base:'current'}
 assert.equal(adaptationPhase(state),'idle')
 assert.equal(adaptationPhase({...state,opening:true}),'connecting')
 assert.equal(adaptationPhase({...state,busy:true,proposal}),'generating')
 assert.equal(adaptationPhase({...state,busy:true,disconnected:true}),'disconnected')
 assert.equal(adaptationPhase({...state,proposal}),'ready')
 assert.equal(adaptationPhase({...state,proposal:{...proposal,base:'old'}}),'stale')
 assert.equal(adaptationPhase({...state,hasSession:true}),'attention')
 assert.equal(adaptationPhase({...state,error:true}),'error')
 assert.equal(adaptationPhase({...state,error:true,hasSession:true}),'attention')
 assert.equal(adaptationPhase({...state,proposal:{...proposal,status:'applied'}}),'applied')
 assert.equal(adaptationPhase({...state,hasSession:true,proposal:{...proposal,status:'dismissed'}}),'attention')
})
test('all adaptation states have translated labels and explanations',()=>{
 for(const labels of Object.values(adaptationLabels)) for(const text of Object.values(labels)){
  assert.ok(workflowEnglish[text],text)
  assert.doesNotMatch(workflowEnglish[text],/\p{Script=Han}/u)
 }
})
