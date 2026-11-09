import assert from 'node:assert/strict'
import {test} from 'node:test'
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createTeamDir,readTeam,writeTeam,withTeamLock,isTeamTask} from '../lib/state.js'
import {runTaskArchives,readTaskArchive,cancelTaskArchive} from '../lib/task-archive.js'
import {parseWorkflowOperations,applyWorkflowOperations,branchCheckpoint} from '../lib/workflow.js'
import {workflowMaterials} from '../lib/workflow-runtime.js'
import {templateSeed,instantiateTemplate} from '../lib/templates.js'
import {resetTaskForRerun} from '../lib/task-rerun.js'
import {configureLoop} from '../lib/workflow-loops.js'
const task=(id,deps=[])=>({id,subject:id,description:'Complete '+id,dependencies:deps,status:'completed',assignee:'worker',createdAt:1,updatedAt:1,output:'Evidence '+id,attempt:1,attemptId:id+'-attempt'})
const team=()=>({id:'demo',name:'demo',captainSessionId:'captain',createdAt:1,taskSeq:3,phase:'running',members:[{name:'worker',id:'',status:'idle',joinedAt:1}],tasks:[task('a'),task('b',['a'])],workflow:{explicitQuality:true,positions:{},discussions:{},history:[]}})
async function fixture(t,copyFiles=false){const workspace=mkdtempSync(join(tmpdir(),'teamflow-archive-'));t.after(()=>rmSync(workspace,{recursive:true,force:true}));const root=join(workspace,'.agent-teams');writeFileSync(join(workspace,'result.txt'),'version one');const state=team();state.tasks[1].changedPaths=['result.txt'];const next=applyWorkflowOperations(state,parseWorkflowOperations([{action:'add_task',id:'archive',kind:'archive',subject:'Archive',description:'Record delivery',dependencies:['b'],archive:{copyFiles,paths:[]}}]));await createTeamDir(root,next);return {root,workspace,state:next,read:()=>readTeam(root,'demo')}}
test('archives upstream versions and evidence, copies exact bytes, retains prior immutable records after rerun',async t=>{
 const f=await fixture(t,true);await Promise.all([runTaskArchives(f.root,f.workspace,'demo'),runTaskArchives(f.root,f.workspace,'demo')]);let state=await f.read(),task=state.tasks.at(-1);assert.equal(task.status,'completed');assert.equal(task.archiveRecords.length,1);assert.ok(isTeamTask(task));const first=task.archiveRecords[0],manifest=await readTaskArchive(f.root,state,'archive',first.id);assert.equal(manifest.tasks[1].attemptId,'b-attempt');assert.equal(manifest.files[0].copied,true);assert.equal(readFileSync(join(f.root,'demo','artifacts',first.id,'files/result.txt'),'utf8'),'version one');assert.equal(first.copiedCount,1)
 writeFileSync(join(f.workspace,'result.txt'),'version two');resetTaskForRerun(task,false,Date.now());await writeTeam(f.root,state);await runTaskArchives(f.root,f.workspace,'demo');state=await f.read();assert.equal(state.tasks.at(-1).archiveRecords.length,2);assert.deepEqual(await readTaskArchive(f.root,state,'archive',first.id),manifest);assert.equal(readFileSync(join(f.root,'demo','artifacts',first.id,'files/result.txt'),'utf8'),'version one')
 await assert.rejects(readTaskArchive(f.root,state,'archive','../../not-authorized'),/不存在/)
})
test('reference-only default, dependency gating, configuration hold and cold execution recovery',async t=>{
 const f=await fixture(t);f.state.tasks[1].status='pending';await writeTeam(f.root,f.state);await runTaskArchives(f.root,f.workspace,'demo');assert.equal((await f.read()).tasks.at(-1).status,'pending');f.state.tasks[1].status='completed';f.state.tasks.at(-1).workflowConfigPending=true;await writeTeam(f.root,f.state);await runTaskArchives(f.root,f.workspace,'demo');assert.equal((await f.read()).tasks.at(-1).status,'pending');delete f.state.tasks.at(-1).workflowConfigPending;f.state.tasks.at(-1).status='in_progress';f.state.tasks.at(-1).attemptId='interrupted';await writeTeam(f.root,f.state);await runTaskArchives(f.root,f.workspace,'demo');const state=await f.read(),r=state.tasks.at(-1).archiveRecords[0];assert.equal(r.copiedCount,0);assert.equal(existsSync(join(f.root,'demo','artifacts',r.id,'files')),false)
})
test('pause revokes an archive attempt and continuing completes a fresh generation',async t=>{
 const f=await fixture(t,true),running=runTaskArchives(f.root,f.workspace,'demo');for(let i=0;i<200;i++){if((await f.read()).tasks.at(-1).status==='in_progress')break;await new Promise(r=>setTimeout(r,2))}
 await withTeamLock(`team:${f.root}:demo`,async()=>{const state=await f.read(),task=state.tasks.at(-1);task.workflowPaused=true;task.status='pending';delete task.attemptId;await writeTeam(f.root,state)});await cancelTaskArchive(f.root,'demo','archive');await running;let state=await f.read();assert.equal(state.tasks.at(-1).status,'pending');assert.equal(state.tasks.at(-1).archiveRecords,undefined);state.tasks.at(-1).workflowPaused=false;await writeTeam(f.root,state);await runTaskArchives(f.root,f.workspace,'demo');assert.equal((await f.read()).tasks.at(-1).status,'completed')
})
test('invalid scopes fail closed, system ownership is enforced, and template roundtrip preserves config',async t=>{
 const f=await fixture(t,true),a=f.state.tasks.at(-1);a.archive.paths=['../outside'];await writeTeam(f.root,f.state);await runTaskArchives(f.root,f.workspace,'demo');const bad=(await f.read()).tasks.at(-1);assert.equal(bad.status,'failed');assert.equal(bad.archiveRecords,undefined)
 assert.throws(()=>parseWorkflowOperations([{action:'add_task',subject:'bad',dependencies:[],kind:'archive',assignee:'worker'}]),/系统/)
 const template=templateSeed(f.state),restored=instantiateTemplate({...template,id:'test',version:1,createdAt:1,updatedAt:1},'restored','captain','restored','goal');assert.equal(restored.tasks.at(-1).kind,'archive');assert.deepEqual(restored.tasks.at(-1).archive,a.archive)
 const loop=team();loop.tasks.push({...task('gate',['b']),status:'pending',assignee:undefined,checkpoint:{round:1,history:[]}});for(const t of loop.tasks){t.status='pending';t.attempt=0;delete t.attemptId}loop.tasks[0].kind='archive';delete loop.tasks[0].assignee;assert.throws(()=>configureLoop(loop,{gateId:'gate',entryId:'a',mode:'human',maxRounds:2,timeoutMinutes:30}),/归档/)
})
test('ordinary human review creates a full rework branch atomically and preserves reviewed evidence',()=>{
 const state=team();state.tasks.push({...task('gate',['b']),assignee:undefined,status:'pending',checkpoint:{round:1,history:[]}});const material=workflowMaterials(state,'gate');const result=branchCheckpoint(state,'gate',['a'],material.evidence,material.evidence,'Fix and rerun tests',material.text);assert.equal(state.tasks.length,3);assert.equal(result.tasks.length,5);assert.equal(result.tasks[2].checkpoint.round,2);assert.equal(result.tasks[2].checkpoint.history[0].decision,'branch');assert.equal(result.tasks[2].checkpoint.history[0].materials,material.text);assert.deepEqual(result.tasks[4].dependencies,[result.tasks[3].id]);assert.deepEqual(result.tasks[2].dependencies,[result.tasks[4].id]);assert.equal(result.tasks[0].output,'Evidence a');assert.throws(()=>branchCheckpoint(state,'gate',['missing'],material.evidence,material.evidence,'x',material.text));assert.equal(state.tasks[2].checkpoint.history.length,0)
})
