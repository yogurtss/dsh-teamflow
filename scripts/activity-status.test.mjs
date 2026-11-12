import test from 'node:test'
import assert from 'node:assert/strict'
import {activityStatus} from '../lib/client/activity-status.js'
import {applyWorkflowOperations} from '../lib/workflow.js'
import {replacedTaskIds} from '../lib/replaced-tasks.js'
const task=(id,patch={})=>({id,status:'pending',dependencies:[],...patch})
const team=tasks=>({phase:'running',tasks,members:[]})
test('workflow completion follows its endpoints even when earlier nodes failed',()=>{
  const failed=task('earlier',{status:'failed'})
  const end=task('finish',{status:'completed',dependencies:['earlier']})
  const result=activityStatus(team([end,failed]))
  assert.equal(result.state,'completed')
  assert.equal(result.percent,100)
  assert.equal(result.completed,1)
  assert.notEqual(activityStatus(team([end,failed,task('second-end',{dependencies:['earlier']})])).state,'completed')
  assert.notEqual(activityStatus(team([failed,{...end,checkpoint:{round:1}}])).state,'completed')
  assert.equal(activityStatus(team([failed,{...end,checkpoint:{round:1,decision:'approve'}}])).state,'completed')
})
test('capsule shows node completion and prioritizes actionable reviews over concurrent work',()=>{
 const result=activityStatus(team([task('a',{status:'completed'}),task('b',{status:'in_progress'}),task('g',{checkpoint:{round:1},dependencies:['a']})]))
 assert.equal(result.percent,33);assert.equal(result.running,1);assert.equal(result.reviews,1);assert.equal(result.attention,1);assert.equal(result.state,'review')
})
test('a manual checkpoint only counts as completed after approval; cancelled tasks do not inflate progress',()=>{
 const tasks=[task('a',{status:'completed'}),task('g',{status:'completed',checkpoint:{round:1}}),task('c',{status:'cancelled'})]
 assert.equal(activityStatus(team(tasks)).percent,33)
 assert.equal(activityStatus(team([task('g',{status:'completed',checkpoint:{round:1,decision:'approve'}})])).state,'completed')
})
test('empty, staged, paused, attention and archive states never imply active execution',()=>{
 assert.equal(activityStatus().state,'history');assert.equal(activityStatus(team([])).percent,0)
 assert.equal(activityStatus({...team([task('a')]),phase:'staged'}).state,'staged')
 assert.equal(activityStatus(team([task('a',{workflowPaused:true})])).state,'paused')
 assert.equal(activityStatus(team([task('a',{status:'failed',workflowConfigPending:true})])).attention,1)
 const archived=activityStatus(team([task('a',{status:'in_progress'})]),true);assert.equal(archived.running,0);assert.equal(archived.state,'archived')
 assert.equal(activityStatus(team([task('g',{checkpoint:{round:1},workflowPaused:true})])).reviews,0)
})

test('pure configuration issues have their own label, including staged workflows; mixed issues stay attention',()=>{
 const config=task('config',{workflowConfigPending:true});
 assert.equal(activityStatus(team([config])).state,'configuration');
 assert.equal(activityStatus({...team([config]),phase:'staged'}).state,'configuration');
 assert.equal(activityStatus(team([config,task('failed',{status:'failed'})])).state,'attention');
 assert.equal(activityStatus(team([config,task('review',{checkpoint:{round:1}})])).state,'attention');
 assert.equal(activityStatus(team([config,task('rerun',{workflowRerunRequired:true})])).state,'attention');
 assert.equal(activityStatus(team([config]),true).state,'archived');
});

test('completed replacement paths retire only related failures from card progress', async () => {
  const failed={id:'old',subject:'Build',description:'Build',status:'failed',dependencies:[]}
  const retry={id:'retry',subject:'Build · 返工 2',description:'Build\n\n返工要求：fix',status:'completed',dependencies:[]}
  const progress=tasks=>{
    const retired=replacedTaskIds(tasks)
    return activityStatus({phase:'running',tasks:tasks.map(t=>({...t,superseded:retired.has(t.id)}))})
  }
  assert.equal(progress([failed,retry]).state,'completed')
  assert.equal(progress([failed,{...retry,status:'pending'}]).state,'attention')
  assert.equal(progress([failed,retry,{...failed,id:'other',subject:'Unrelated'}]).state,'attention')
  assert.equal(progress([failed,retry,{id:'wait',status:'pending',subject:'Waiting',dependencies:['old']}]).state,'attention')
  assert.equal(progress([failed,{...retry,id:'second',status:'failed',replacesTaskIds:['old']},{...retry,id:'third',replacesTaskIds:['second']}]).percent,100)
  const stranded={id:'stranded',subject:'Old test',status:'pending',dependencies:['old']}
  assert.equal(progress([failed,stranded,{...retry,replacesTaskIds:['stranded']}]).state,'completed')
  const repair={id:'fix',subject:'Fix',kind:'repair',status:'completed',dependencies:[],findingSourceTaskIds:['old']}
  assert.equal(progress([failed,repair]).state,'attention')
  assert.equal(progress([failed,repair,{id:'check',subject:'Check',kind:'review',verdict:'pass',status:'completed',dependencies:['fix']}]).state,'completed')
})

test('rewiring a failed input in two canvas edits completes the outer card only after the new path finishes',()=>{
  const old=task('old',{subject:'Old path',status:'failed'})
  const next=task('new',{subject:'New path',status:'completed'})
  const end=task('end',{subject:'Delivery',dependencies:['old']})
  const progress=(tasks,workflow)=>{
    const retired=replacedTaskIds(tasks,workflow)
    return activityStatus(team(tasks.map(t=>({...t,superseded:retired.has(t.id)}))))
  }
  for(const intermediate of [[],['old','new']]){
    let graph=team([old,next,end])
    for(const dependencies of [intermediate,['new']]){
      graph=applyWorkflowOperations(graph,[{action:'update_task',id:'end',dependencies}])
    }
    assert.notEqual(progress(graph.tasks).state,'completed')
    graph.tasks[2].status='completed'
    assert.equal(graph.tasks[0].status,'failed')
    assert.equal(progress(graph.tasks).percent,100)
    assert.equal(progress(graph.tasks).state,'completed')
    assert.equal(progress([...graph.tasks,task('waiting',{dependencies:['old']})]).state,'attention')
    const earlier=task('earlier',{status:'failed'})
    assert.equal(progress([earlier,{...old,dependencies:['earlier']},...graph.tasks.slice(1)]).state,'completed')
  }
  const legacy=[old,next,{...end,status:'completed',dependencies:['new']}]
  const history=[{status:'applied',operations:[{action:'add_task',id:'end',dependencies:['old']}]}]
  assert.equal(progress(legacy,{history}).state,'completed')
  assert.equal(progress(legacy,{history:[{...history[0],status:'dismissed'}]}).state,'attention')
})
