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

test('100+ reviewed weights and oversized text are listed as policy exclusions without reading content',async t=>{
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
   assert.ok(result.artifacts.every(a=>a.skipped && a.present && !a.unreadable && !a.sha256))
  }
  const audit=auditTeamWorkspace(root,{tasks:[{reviewedArtifacts:paths.map(path=>({path}))}]})
  assert.equal(audit.gaps,undefined)
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
  assert.equal(result.artifacts.filter(a=>a.skipped === 'budget').length,1)
  assert.equal(result.artifacts.filter(a=>a.sha256).reduce((n,a)=>n+(a.size??0),0),MAX_SCOPE_BYTES)
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


test('policy exclusions survive persistence and legacy evidence without masking actual failures',async t=>{
 const {artifactDrift,isArtifactDigest}=await import('../lib/quality-gates.js')
 const {artifactEvidence}=await import('../lib/artifact-policy.js')
 const skipped={path:'model.safetensors',present:true,skipped:'type',size:10,mtimeMs:1,reason:'model.safetensors: unsupported artifact file type; content not audited'}
 assert.equal(isArtifactDigest(skipped),true)
 assert.equal(isArtifactDigest({...skipped,sha256:'a'.repeat(64)}),false)
 const legacy={...skipped,present:false,unreadable:true};delete legacy.skipped
 assert.deepEqual(artifactDrift([legacy],[skipped]),[])
 assert.deepEqual(artifactDrift([skipped],[{...skipped,size:999,mtimeMs:2}]),[])
 assert.deepEqual(artifactEvidence([skipped]),artifactEvidence([{...skipped,size:999,mtimeMs:2}]))
 assert.equal(artifactDrift([skipped],[{path:skipped.path,present:false}]).length,1)
 assert.equal(artifactDrift([skipped],[{path:skipped.path,present:false,unreadable:true,reason:'EACCES'}]).length,1)
 assert.equal(artifactDrift([{path:'a.txt',present:true,sha256:'a'.repeat(64)}],[{path:'a.txt',present:true,sha256:'b'.repeat(64)}]).length,1)
})

test('checkpoint and loop evidence ignore skipped bytes and timestamps but detect audited edits',async t=>{
 const {workflowMaterials}=await import('../lib/workflow-runtime.js')
 const {loopArtifactEvidence}=await import('../lib/workflow-loop-evidence.js')
 const root=await mkdtemp(join(tmpdir(),'teamflow-policy-evidence-'));t.after(()=>rm(root,{recursive:true,force:true}))
 fs.writeFileSync(join(root,'a.txt'),'one');fs.writeFileSync(join(root,'model.bin'),'one')
 const paths=['a.txt','model.bin']
 const team={tasks:[{id:'work',subject:'work',dependencies:[],status:'completed',changedPaths:paths},{id:'gate',subject:'gate',description:'Review',dependencies:['work'],checkpoint:{round:1,history:[]}}]}
 const before=workflowMaterials(team,'gate',root)
 const loopBefore=await loopArtifactEvidence(root,team,{bodyIds:['work']})
 fs.utimesSync(join(root,'a.txt'),new Date(),new Date(Date.now()+5000));fs.writeFileSync(join(root,'model.bin'),'changed unreviewed model')
 assert.equal(workflowMaterials(team,'gate',root).evidence,before.evidence)
 assert.equal(await loopArtifactEvidence(root,team,{bodyIds:['work']}),loopBefore)
 fs.writeFileSync(join(root,'a.txt'),'two')
 assert.notEqual(workflowMaterials(team,'gate',root).evidence,before.evidence)
 assert.notEqual(await loopArtifactEvidence(root,team,{bodyIds:['work']}),loopBefore)
})

test('directory aliases and duplicates do not consume extra file slots',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-scope-cap-'));t.after(()=>rm(root,{recursive:true,force:true}))
 fs.mkdirSync(join(root,'data'))
 for(let i=0;i<200;i++)fs.writeFileSync(join(root,'data',i+'.txt'),'x')
 for(const patterns of [['data'],['data/'],['data/', 'data/0.txt']]){
  const read=readArtifactScope(root,patterns);assert.equal(read.artifacts.length,200);assert.deepEqual(read.gaps,[])
 }
})


test('scope byte-budget selection is independent of declaration order and directory spelling',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-stable-scope-'));t.after(()=>rm(root,{recursive:true,force:true}))
 fs.mkdirSync(join(root,'data'))
 const paths=Array.from({length:17},(_,i)=>'data/'+i+'.txt')
 for(const path of paths)fs.writeFileSync(join(root,path),Buffer.alloc(MAX_ARTIFACT_BYTES,65))
 const baseline=readArtifactScope(root,paths)
 for(const patterns of [[...paths].reverse(),['data'],['data/'],['data/',...paths]])assert.deepEqual(readArtifactScope(root,patterns),baseline)
})

test('overlapping directory scopes at the exact cap do not fabricate a gap',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-overlap-'));t.after(()=>rm(root,{recursive:true,force:true}))
 fs.mkdirSync(join(root,'data'));fs.mkdirSync(join(root,'data/sub'))
 for(let i=0;i<200;i++)fs.writeFileSync(join(root,'data/sub',i+'.txt'),'x')
 const result=readArtifactScope(root,['data/','data/sub/','data','data/'])
 assert.equal(result.artifacts.length,200);assert.deepEqual(result.gaps,[])
})

test('previews run off-thread, coalesce in-flight reads and preserve truncation and path policy',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-preview-worker-')),reader=createWorkspaceAuditor()
 t.after(async()=>{await reader.dispose();await rm(root,{recursive:true,force:true})})
 fs.writeFileSync(join(root,'huge.txt'),Buffer.alloc(MAX_ARTIFACT_BYTES+1,65))
 let tick=false;const timer=setTimeout(()=>{tick=true},0)
 const first=reader.preview(root,'huge.txt');assert.equal(reader.preview(root,'huge.txt'),first)
 const preview=await first;clearTimeout(timer)
 assert.equal(tick,true);assert.equal(preview.truncated,true);assert.equal(preview.previewBytes,256*1024);assert.equal(preview.sha256,undefined)
 assert.equal((await reader.preview(root,'../outside.txt')).status,'blocked')
 await reader.dispose();await assert.rejects(reader.preview(root,'huge.txt'),/disposed/)
})
