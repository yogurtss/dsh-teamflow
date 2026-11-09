/** Run with workflow-preview.mjs, TEAMFLOW_PREVIEW_DISCUSSION=1. No model calls. */
import assert from 'node:assert/strict'
const {chromium}=await import(process.env.TEAMFLOW_PLAYWRIGHT_MODULE??'playwright')
const browser=await chromium.launch({channel:process.env.TEAMFLOW_BROWSER_CHANNEL??'msedge',headless:true})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 let stage='idle',opens=0,release,fail=false
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/plugins/dsh-agent-teams/workflow',async route=>{
  const body=route.request().postDataJSON()
  if(fail&&body.action==='state')return route.abort()
  if(body.action==='open_discussion'&&body.discussion==='adapt'){
   opens++;await new Promise(resolve=>{release=resolve})
  }
  const response=await route.fetch(),json=await response.json()
  if(json.team){
   delete json.currentDiscussion
   json.team.phase='staged'
   json.team.workflow.templateSource={id:'fixture',name:'测试模板',version:1}
   json.busy=stage==='generating'?['adapt']:[]
   if(stage!=='idle'){
    json.team.workflow.discussions['discussion:adapt']??={key:'adapt',messages:[],calls:[]}
    json.team.workflow.discussions['discussion:adapt'].native={sessionId:'session-at-discussion-preview-adapt',label:'adapt'}
    if(body.action==='open_discussion')json.openedSessionId='session-at-discussion-preview-adapt'
   }
   const discussion=json.team.workflow.discussions['discussion:adapt']
   if(discussion&&stage!=='ready')delete discussion.proposal
   if(stage==='ready'&&discussion)discussion.proposal={id:'adapt-test',status:'pending',base:json.base,title:'本次任务方案',operations:[{action:'update_task',id:'t3',description:'适配后的任务要求'}],createdAt:1}
  }
  if(body.action==='conversation_state')json.busy=stage==='generating'
  await route.fulfill({response,json})
 })
 await page.goto(process.env.TEAMFLOW_ADAPTATION_URL??'http://127.0.0.1:8388')
 await page.getByRole('button',{name:/^Teamflow/}).first().click()
 const banner=page.locator('[data-adaptation-state]')
 await banner.getByRole('button',{name:'统一适配本次任务',exact:true}).click()
 await page.locator('[data-adaptation-state="connecting"]').waitFor()
 await banner.getByRole('button').click()
 await page.getByRole('button',{name:'交付内容',exact:true}).click()
 await banner.getByRole('button').click()
 await page.getByRole('heading',{name:'本次任务适配',exact:true}).waitFor()
 assert.equal(opens,1)
 while(!release)await new Promise(r=>setTimeout(r,10))
 stage='generating';release()
 await page.locator('[data-adaptation-state="generating"]').waitFor()
 assert.equal(await page.getByRole('button',{name:'确认并启动',exact:true}).isDisabled(),true)
 await page.getByRole('button',{name:'交付内容',exact:true}).click()
 stage='ready'
 await page.locator('[data-adaptation-state="ready"]').waitFor({timeout:12000})
 assert.equal(await page.getByRole('button',{name:'交付内容',exact:true}).getAttribute('aria-pressed'),'true')
 await banner.getByRole('button').click()
 await page.getByRole('heading',{name:'本次任务适配',exact:true}).waitFor()
 assert.equal(opens,1,'returning to the discussion must not generate again')
 fail=true
 await page.locator('[data-adaptation-state="disconnected"]').waitFor({timeout:12000})
 await banner.getByRole('button').click()
 assert.equal(opens,1)
 fail=false
 await page.locator('[data-adaptation-state="ready"]').waitFor({timeout:12000})
 await page.reload()
 await page.getByRole('button',{name:/^Teamflow/}).first().click()
 await page.locator('[data-adaptation-state="ready"]').waitFor({timeout:12000})
 await banner.getByRole('button').click()
 assert.equal(opens,1,'refresh must restore the existing discussion')
 assert.deepEqual(errors,[])
 console.log('PASS slow opening, duplicate clicks, panel navigation, busy guard, completion without focus theft, disconnect/reconnect and reload')
}finally{await browser.close()}
