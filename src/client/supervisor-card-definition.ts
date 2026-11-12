import type {ConversationNodeDefinition} from '@deepseek-ai/dsh-client-ui-conversation/client'
import {readCard,type SupervisorCard} from '../super-agent-card.ts'
declare module '@deepseek-ai/dsh-client-ui-chat/client' { interface ChatNodeDataMap { 'teamflow-supervisor':SupervisorCard } }
export const supervisorDefinition:ConversationNodeDefinition<SupervisorCard>={
  kind:'teamflow-supervisor',target:'chat',
  match:event=>{const r=readCard(event);return r?{id:r.card.key,role:r.revision}:null},
  start:(_ctx,m)=>readCard(m.event)!.card,
  update:(_ctx,m)=>readCard(m.event)!.card,
  buildViewNode:c=>{
    const latest=c.matches.at(-1)
    if(!latest||!c.state)return null
    return {kind:'teamflow-supervisor',key:c.key,id:c.id,target:'chat',anchorSeq:latest.event.seq,location:latest.location,visibility:'visible',data:c.state}
  },
}
