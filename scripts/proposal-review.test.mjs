import test from 'node:test'
import assert from 'node:assert/strict'
import { lineDiff, reviewedOperations, reviewFields, setReviewField } from '../lib/client/proposal-review.js'
const team = { members: [{ name:'worker', summary:'Keep\nOld line', role:'reviewer', executionPrompt:'Read files' }], tasks:[{ id:'t1', subject:'Task', description:'Details', assignee:'worker', dependencies:[] }] }

test('line comparison preserves unchanged lines while marking additions and removals', () => {
  assert.deepEqual(lineDiff('keep\nold\ntail', 'keep\nnew\ntail'), [{kind:'same',text:'keep'},{kind:'removed',text:'old'},{kind:'added',text:'new'},{kind:'same',text:'tail'}])
  assert.deepEqual(lineDiff('', 'new'), [{kind:'added',text:'new'}])
  assert.deepEqual(lineDiff('old', ''), [{kind:'removed',text:'old'}])
  assert.deepEqual(lineDiff('same', 'same'), [{kind:'same',text:'same'}])
})

test('human can edit the latest member value while retaining unchanged fields', () => {
  const operation = { action:'update_member', name:'worker', summary:'Keep\nNew line' }
  const fields = reviewFields(team, operation).fields
  assert.equal(fields.find(f=>f.key==='role').after, 'reviewer')
  const edited = setReviewField(operation, fields.find(f=>f.key==='summary'), 'Keep\nHuman line')
  assert.deepEqual(reviewedOperations(team,[edited],[true]), [{action:'update_member',name:'worker',summary:'Keep\nHuman line'}])
  assert.deepEqual(reviewedOperations(team,[edited],[false]), [])
  assert.deepEqual(reviewedOperations(team,[setReviewField(edited,fields.find(f=>f.key==='summary'),'Keep\nOld line')],[true]), [])
})

test('approval supports editable additions, dependencies and keeping deleted objects', () => {
  const add = {action:'add_member',name:'new',summary:'New role'}
  assert.equal(reviewFields(team,add).fields.find(f=>f.key==='summary').before,'')
  const change = {action:'update_task',id:'t1',dependencies:['t2']}
  const field=reviewFields(team,change).fields.find(f=>f.key==='dependencies')
  assert.deepEqual(setReviewField(change,field,'t2, t3\nt2').dependencies,['t2','t3'])
  const remove={action:'remove_member',name:'worker'}
  assert.ok(reviewFields(team,remove).fields.every(f=>!f.editable&&f.after===''))
  assert.deepEqual(reviewedOperations(team,[remove],[false]),[])
  assert.ok(!reviewFields(team,{action:'add_task',subject:'Gate',dependencies:[],checkpoint:true}).fields.some(f=>f.key==='assignee'))
})

test('large multiline instructions use bounded diff memory', () => {
  const a = Array.from({length:450},(_,i)=>`old ${i}`).join('\n'), b=Array.from({length:450},(_,i)=>`new ${i}`).join('\n')
  const result=lineDiff(a,b)
  assert.equal(result.filter(line=>line.kind==='removed').length,450)
  assert.equal(result.filter(line=>line.kind==='added').length,450)
})
