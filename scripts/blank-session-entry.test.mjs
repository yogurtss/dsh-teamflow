import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import * as jsx from 'react/jsx-runtime'
import { blankTeamflowSession } from '../lib/client/session-navigation.js'
const require=createRequire(import.meta.url)
test('pinned real Web header suppresses action slots while a session is blank',()=>{
  const root=dirname(require.resolve('@deepseek-ai/dsh-client-ui-conversation/package.json'))
  const bundle=readFileSync(join(root,'lib/client.js'),'utf8')
  const start=bundle.indexOf('function ConversationSessionHeader(')
  assert.ok(start>=0,'Review the new host header contract before updating this fixture')
  const source=bundle.slice(start,bundle.indexOf('/**',start)).trim()
  const Header=runInNewContext('('+source+')',{react_jsx_runtime:jsx,equalBreadcrumbs:()=>true,ConversationRoot_module_css_default:{},resolveActiveView:()=>undefined})
  const calls=[]
  const props={sessionId:'blank',useConversationViews:()=>[],useStore:()=>null,useSessions:()=>[],renderSlot:name=>{calls.push(name);return null},t:key=>key}
  Header({...props,hideChrome:true})
  assert.ok(!calls.includes('conversation.session.header.actions'))
  calls.length=0;Header({...props,hideChrome:false})
  assert.ok(calls.includes('conversation.session.header.actions'))
})
test('blank entry follows selected session and disappears outside conversations or after first turn',()=>{
  const row={id:'new',blank:true,retainedBy:{mainView:1}}
  assert.equal(blankTeamflowSession({byId:{new:row}},true),'new')
  assert.equal(blankTeamflowSession({byId:{new:row}},false),undefined)
  assert.equal(blankTeamflowSession({byId:{new:{...row,blank:false}}},true),undefined)
  assert.equal(blankTeamflowSession({byId:{new:{...row,retainedBy:{background:1}}}},true),undefined)
  assert.equal(blankTeamflowSession({current:'new',byId:{new:row}},true),'new')
  assert.equal(blankTeamflowSession({byId:{}},true),undefined)
})
test('ordinary header entry is independent of the optional sidebar and blank entry is additive',()=>{
  const source=readFileSync(new URL('../src/client/index.tsx',import.meta.url),'utf8')
  assert.ok(source.indexOf("ctx.slots.inject('conversation.session.header.actions'") < source.indexOf("ctx.inject(['sidebarRight'"))
  assert.match(source,/<BlankSessionTeamflowEntry/)
  assert.ok(source.includes("ctx.slots.inject('shell.overlay'"))
  assert.ok(!source.includes("name: 'conversation.session.header.corner'"),'Do not replace the host sidebar toggle')
})
