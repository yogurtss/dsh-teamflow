import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { currentSessionId, openAgentTeamMember } from '../lib/client/session-navigation.js'
import { toolResultFailed, teamCardsForTurn } from '../lib/client/agent-teams-card-definition.js'

test('turn cards observe replay into the same node store after navigation', async () => {
  const hooks = registerHooks({ resolve(specifier, context, next) {
    let source
    if (context.parentURL?.endsWith('/client/TeamChatEntry.js')) {
      if (specifier === './AgentTeamsCard.js') source = 'export const AgentTeamsSummary = ({data}) => data.teamName'
      if (specifier === './WorkflowWorkbench.js') source = 'export const WorkflowWorkbench = () => null'
      if (specifier.endsWith('.module.css')) source = 'export default {}'
    }
    return source === undefined ? next(specifier, context) : { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true }
  } })
  let TeamTurnCard
  try { ({ TeamTurnCard } = await import('../lib/client/TeamChatEntry.js')) }
  finally { hooks.deregister() }
  const nodes = new Map(), snapshot = { nodes }
  let selector, equal, selected
  const useChat = (select, eq = Object.is) => {
    selector = select; equal = eq; selected = select(snapshot); return selected
  }
  const props = { sessionId: 'captain', turn: { turn: 1, status: 'closed' }, useChat, t: key => key, openMember() {} }
  const render = () => renderToStaticMarkup(React.createElement(TeamTurnCard, props))
  const card = (key, turn = 1) => ({ key, kind: 'agent-teams', location: { kind: 'step', turn: { turn, status: 'closed' } }, data: { teamName: key, teamId: key, members: [] } })
  assert.equal(render(), '')
  nodes.set('restored', card('restored'))
  assert.equal(equal(selected, selector(snapshot)), false, 'replay must notify even though the node container did not change')
  assert.match(render(), /restored/)
  assert.equal(equal(selected, selector(snapshot)), true, 'unchanged cards must not trigger render loops')
  nodes.set('other-turn', card('other-turn', 2))
  assert.equal(equal(selected, selector(snapshot)), true, 'unrelated turns do not rerender this card')
  nodes.set('restored', { ...nodes.get('restored'), data: { teamName: 'updated' } })
  assert.equal(equal(selected, selector(snapshot)), false)
  assert.match(render(), /updated/)
  nodes.clear()
  assert.equal(equal(selected, selector(snapshot)), false, 'unloaded cards are removed')
  assert.equal(render(), '')
  nodes.set('returned', card('returned'))
  assert.equal(equal(selected, selector(snapshot)), false, 'returning to the conversation restores the card again')
  assert.match(render(), /returned/)
  props.turn = { turn: 1, status: 'running' }
  assert.equal(render(), '', 'open turns keep their inline card instead of a duplicate tail')
})

test('known member navigation does not wait for another remote catalog request',async()=>{
 const address={parentSessionId:'parent',childSessionId:'child',mode:'continuable'},opened=[]
 await openAgentTeamMember({open(){},subagentAddress:()=>address,refreshSubagents:()=>{throw Error('redundant remote round trip')},openSubagent:value=>opened.push(value)},'parent','child')
 assert.deepEqual(opened,[address])
 let refreshed=false
 await openAgentTeamMember({open(){},subagentAddress:()=>({...address,parentSessionId:'other'}),refreshSubagents:async()=>{refreshed=true},openSubagent(){}},'parent','child')
 assert.equal(refreshed,true,'an address from another parent must not be reused')
})

test('panel follows mainView ownership including retained subagents outside the list ids', () => {
  assert.equal(currentSessionId({ current: 'old', byId: {} }), 'old')
  assert.equal(currentSessionId({ current: undefined, byId: {} }), undefined)
  const byId = { root: { id: 'root', retainedBy: { background: 1 } }, child: { id: 'child', retainedBy: { mainView: 1 } } }
  assert.equal(currentSessionId({ byId, ids: ['root'] }), 'child')
  assert.equal(currentSessionId({ byId: { root: byId.root } }), undefined)
})

test('new workspace navigation opens an exact durable member address without removed session methods', async () => {
  const targets = []
  assert.equal(await openAgentTeamMember({}, 'captain', 'child', undefined, { openSession: target => targets.push(target) }), 'subagent')
  assert.deepEqual(targets, [{ parentSessionId: 'captain', childSessionId: 'child', mode: 'continuable' }])
  await assert.rejects(openAgentTeamMember({}, 'captain', 'child'), /does not expose session navigation/)
})

test('failed create results never become successful team cards across both message formats', () => {
  assert.equal(toolResultFailed({ content: [{ type: 'text', text: 'rejected' }], isError: true }), true)
  assert.equal(toolResultFailed({ content: [{ type: 'tool-result', isError: true, content: [] }] }), true)
  assert.equal(toolResultFailed({ content: [{ type: 'text', text: 'created' }] }), false)
})

test('legacy sessions keep their old address navigation even when uiWorkspace exists', async () => {
  const calls = []
  await openAgentTeamMember({ open: id => calls.push(id) }, 'parent', 'child', undefined, {
    openSession: () => { throw new Error('old uiWorkspace does not accept a subagent address') },
  })
  assert.deepEqual(calls, ['child'])
})


test('turn tail keeps each team summary on its create turn and supports multiple teams', () => {
  const first = { key: 'a', kind: 'agent-teams', location: { kind: 'step', turn: { turn: 1 } } }
  const second = { key: 'b', kind: 'agent-teams', location: { kind: 'turn', turn: { turn: 1 } } }
  const later = { key: 'c', kind: 'agent-teams', location: { kind: 'step', turn: { turn: 2 } } }
  const prose = { key: 'd', kind: 'assistant-step', location: first.location }
  const unbound = { key: 'e', kind: 'agent-teams', location: { kind: 'session' } }
  const nodes = new Map([first, second, later, prose, unbound].map(node => [node.key, node]))
  assert.deepEqual(teamCardsForTurn(nodes.values(), 1), [first, second])
  assert.deepEqual(teamCardsForTurn(nodes.values(), 2), [later])
  assert.deepEqual(teamCardsForTurn(nodes.values(), 3), [])
})
