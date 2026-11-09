import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createWorkspaceAuditor} from '../lib/workspace-audit-async.js'
import {auditTeamWorkspace} from '../lib/workspace-audit.js'
import {createTeamDir} from '../lib/state.js'
import {collectTeamsActivity,assembleTeamSnapshot} from '../lib/snapshot.js'
import {createWorkflowCache,workflowCacheKey} from '../lib/client/workflow-cache.js'
import fs from 'node:fs'
import {syncBuiltinESMExports} from 'node:module'
import {readArtifactScope,workspacePathExists,MAX_ARTIFACT_BYTES,MAX_SCOPE_BYTES,ARTIFACT_CACHE_TTL_MS} from '../lib/artifacts.js'

test('100+ reviewed weights and oversized text are rejected before reading any content',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-weights-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const paths=Array.from({length:110},(_,i)=>`model-${i}.safetensors`)
 for(const path of paths)fs.writeFileSync(join(root,path),'weights')
 fs.writeFileSync(join(root,'huge.txt'),Buffer.alloc(MAX_ARTIFACT_BYTES+1))
 paths.push('huge.txt')
 const original=fs.readSync;let reads=0
 fs.readSync=(...args)=>{reads++;return original(...args)};syncBuiltinESMExports()
 try {
  for(const patterns of [paths,['.']]){
   const result=readArtifactScope(root,patterns)
   assert.equal(result.artifacts.length,111)
   assert.ok(result.artifacts.every(a=>a.unreadable && !a.sha256))
  }
  const audit=auditTeamWorkspace(root,{tasks:[{reviewedArtifacts:paths.map(path=>({path}))}]})
  assert.equal(audit.gaps.length,111)
  assert.equal(workspacePathExists(root,'model-0.safetensors'),true)
  assert.equal(reads,0)
 } finally {fs.readSync=original;syncBuiltinESMExports()}
})

test('polling digest cache expires, notices edits/deletions, isolates roots and authoritative reads bypass it',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-digest-cache-'));t.after(()=>rm(root,{recursive:true,force:true}))
 fs.mkdirSync(join(root,'other'));fs.writeFileSync(join(root,'a.txt'),'one');fs.writeFileSync(join(root,'other','a.txt'),'two')
 const original=fs.readSync,clock=Date.now;let reads=0,now=clock()
 fs.readSync=(...args)=>{reads++;return original(...args)};Date.now=()=>now;syncBuiltinESMExports()
 try {
  const read=(dir=root,options={cache:true})=>readArtifactScope(dir,['a.txt'],options).artifacts[0]
  const first=read();assert.equal(reads,1)
  first.sha256='mutated caller';assert.notEqual(read().sha256,'mutated caller');assert.equal(reads,1)
  read(root,{});assert.equal(reads,2)
  read();assert.equal(reads,3)
  now+=ARTIFACT_CACHE_TTL_MS;read();assert.equal(reads,4)
  assert.notEqual(read(join(root,'other')).sha256,read().sha256)
  fs.writeFileSync(join(root,'a.txt'),'edited');assert.equal(read().size,6)
  fs.unlinkSync(join(root,'a.txt'));assert.equal(read().present,false)
 } finally {fs.readSync=original;Date.now=clock;syncBuiltinESMExports()}
})

test('scope byte budget caps aggregate reading even for allowed files and cache hits',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-byte-budget-'));t.after(()=>rm(root,{recursive:true,force:true}))
 for(let i=0;i<MAX_SCOPE_BYTES/MAX_ARTIFACT_BYTES+1;i++)fs.writeFileSync(join(root,`${i}.txt`),Buffer.alloc(MAX_ARTIFACT_BYTES,65))
 for(let i=0;i<2;i++){
  const result=readArtifactScope(root,['.'],{cache:true})
  assert.equal(result.artifacts.filter(a=>a.unreadable).length,1)
  assert.equal(result.artifacts.filter(a=>a.present).reduce((n,a)=>n+(a.size??0),0),MAX_SCOPE_BYTES)
 }
})

test('ordinary card snapshots never read artifacts and failed collection cannot masquerade as deletion',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-no-audit-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const state={id:'team',name:'Team',captainSessionId:'captain',createdAt:1,members:[],tasks:[],taskSeq:0}
 await createTeamDir(root,state)
 const ctx={agents:{get(){}},logger:{warn(){}}}
 const original=fs.readSync;let reads=0
 fs.readSync=(...args)=>{reads++;return original(...args)};syncBuiltinESMExports()
 try {
  const cards=await collectTeamsActivity(ctx,[{workspace:'fixture',stateRoot:root}],new Set(['captain']))
  assert.equal(cards.length,1);assert.equal(cards[0].delivery,undefined);assert.equal(reads,0)
  fs.writeFileSync(join(root,'team','team.json'),'{broken')
  await assert.rejects(collectTeamsActivity(ctx,[{workspace:'fixture',stateRoot:root}]))
 } finally {fs.readSync=original;syncBuiltinESMExports()}
 const index=fs.readFileSync(new URL('../src/index.ts',import.meta.url),'utf8')
 const route=index.slice(index.indexOf("path: '/plugins/dsh-agent-teams/state'"),index.indexOf("'agent-teams: activity route'"))
 assert.doesNotMatch(route,/workspacePath:|activityAuditor|auditTeamWorkspace/)
 assert.match(route,/writeHead\(503/)
})

test('on-demand worker times out and clears jobs; a fresh worker can serve evidence',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-audit-timeout-'))
 const stalled=createWorkspaceAuditor({timeoutMs:1}),healthy=createWorkspaceAuditor()
 t.after(async()=>{await stalled.dispose();await healthy.dispose();await rm(root,{recursive:true,force:true})})
 fs.writeFileSync(join(root,'a.txt'),'evidence')
 await assert.rejects(stalled.readScope(root,['a.txt']),/timed out/)
 await assert.rejects(stalled.readScope(root,['a.txt']),/timed out/)
 const result=await healthy.readScope(root,['a.txt'],true)
 assert.equal(result.artifacts[0].size,8)
 assert.deepEqual(await healthy.readScope(root,['a.txt'],true),result)
})

test('workflow view memory is bounded, owner-scoped, expires and never caches oversized records',()=>{
 const cache=createWorkflowCache(2,100,1000)
 const a=workflowCacheKey('a','same',false),b=workflowCacheKey('b','same',false)
 cache.set(a,{n:1});cache.set(b,{n:2});assert.equal(cache.get(a).n,1)
 cache.set('c',{n:3});assert.equal(cache.get(b),undefined)
 cache.set('huge','x'.repeat(100));assert.equal(cache.get('huge'),undefined);assert.equal(cache.get(a).n,1)
 assert.notEqual(a,workflowCacheKey('a','same',true))
 const expired=createWorkflowCache(1,100,-1);expired.set('a',1);assert.equal(expired.get('a'),undefined)
})

test('scoped polling does not inspect mailboxes or audit unrelated teams',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-scope-'));t.after(()=>rm(root,{recursive:true,force:true}))
 for(let i=0;i<40;i++)await createTeamDir(root,{id:`team-${i}`,name:'Team',captainSessionId:`captain-${i}`,createdAt:1,members:[],tasks:[],taskSeq:0})
 const audits=[]
 const ctx={agents:{get(){}},logger:{warn(){}}}
 const result=await collectTeamsActivity(ctx,[{workspace:'fixture',stateRoot:root,workspacePath:root}],new Set(['captain-20']),async(_,team)=>{audits.push(team.id);return{artifacts:[],expandedScope:[]}})
 assert.deepEqual(result.map(t=>t.teamId),['team-20']);assert.deepEqual(audits,['team-20'])
 const state={id:'team-20',name:'Team',captainSessionId:'captain-20',createdAt:1,members:[],tasks:[],taskSeq:0}
 const unavailable=await assembleTeamSnapshot(ctx,root,'fixture',state,{workspacePath:root,auditWorkspace:async()=>{throw Error('worker unavailable')}})
 assert.equal(unavailable.teamId,state.id,'worker failure must not make the team disappear')
 assert.equal(unavailable.delivery.ok,false,'failed audit must not appear verified')
})

test('background audits retain exact byte checks, coalesce only in-flight work and leave timers responsive',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-audit-')),auditor=createWorkspaceAuditor()
 t.after(async()=>{await auditor.dispose();await rm(root,{recursive:true,force:true})})
 await writeFile(join(root,'result.txt'),Buffer.alloc(1024*1024,65))
 const team={tasks:[{id:'review',reviewedArtifacts:[{path:'result.txt'}]}]}
 let timerRan=false;const timer=setTimeout(()=>{timerRan=true},0)
 const first=auditor.audit(root,team);assert.equal(auditor.audit(root,team),first)
 const value=await first;clearTimeout(timer);assert.equal(timerRan,true)
 assert.deepEqual(value,auditTeamWorkspace(root,team))
 await writeFile(join(root,'result.txt'),'changed')
 const changed=await auditor.audit(root,team);assert.notEqual(changed.artifacts[0].sha256,value.artifacts[0].sha256)
 await auditor.dispose();await assert.rejects(auditor.audit(root,team),/disposed/)
})
