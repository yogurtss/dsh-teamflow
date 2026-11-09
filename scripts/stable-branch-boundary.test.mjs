import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {readTeam,readTeamSync,writeTeam} from '../lib/state.js'
test('stable main rejects development state without altering it',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-stable-boundary-'));t.after(()=>rm(root,{recursive:true,force:true}))
 await mkdir(join(root,'demo'))
 for(const feature of [{workflow:{loops:[{id:'dev-loop'}]}},{workflow:{loops:[],loopRevision:1}},{tasks:[{id:'archive',kind:'archive'}]}]){
  const value={id:'demo',name:'Demo',captainSessionId:'captain',createdAt:1,members:[],tasks:[],taskSeq:0,...feature}
  const raw=JSON.stringify(value),file=join(root,'demo','team.json');await writeFile(file,raw)
  await assert.rejects(readTeam(root,'demo'),/dev build/);assert.throws(()=>readTeamSync(root,'demo'),/dev build/)
  await assert.rejects(writeTeam(root,value),/dev build/);assert.equal(await readFile(file,'utf8'),raw)
 }
})


test('stable main refuses development templates instead of silently dropping their control flow',async()=>{
 const {parseTemplate}=await import('../lib/templates.js')
 for(const value of [{loops:[{gateId:'gate'}]},{loops:'malformed'}])assert.throws(()=>parseTemplate(value),/dev build/)
 assert.throws(()=>parseTemplate({members:[],tasks:[{id:'archive',kind:'archive'}]}),/dev build/)
})
