/** Blank Web sessions hide header.actions; the additive shell seat stays mounted. */
import { useSyncExternalStore } from 'react'
import type { ActivityPanelProps } from './ActivityPanel.tsx'
import { blankTeamflowSession, openWorkflowConversation } from './session-navigation.ts'
import { WorkflowWorkbench } from './WorkflowWorkbench.tsx'
import css from './BlankSessionTeamflowEntry.module.css'

export function BlankSessionTeamflowEntry({sessionsList,modelDirectories,openMember,t,conversationVisible=true}:ActivityPanelProps) {
  const sessions=useSyncExternalStore(sessionsList.subscribe,sessionsList.getSnapshot)
  const id=blankTeamflowSession(sessions,conversationVisible)
  if(!id)return null
  return <div className={css.entry} data-teamflow-blank-entry><WorkflowWorkbench key={id} sessionId={id} nativeOnly t={t} modelDirectory={modelDirectories.directoryFor(id)}
    openConversation={target=>openWorkflowConversation(openMember,target as typeof id)}
    openExecution={(target,parent)=>openMember((parent??id) as typeof id,target as typeof id)}/></div>
}
