/** Workflow UI locale follows the host; user content is never translated implicitly. */
import { createContext, useContext, type ReactNode } from 'react'
import type { AgentTeamsTranslate } from './locales.ts'
import { workflowText, sourceText, type WorkflowText } from './workflow-text.ts'
export { workflowText, sourceText, type WorkflowText } from './workflow-text.ts'
const WorkflowLocaleContext = createContext<WorkflowText>(sourceText)
export function WorkflowLocale({ t, children }: { t?: AgentTeamsTranslate; children: ReactNode }) {
  const inherited = useContext(WorkflowLocaleContext)
  return <WorkflowLocaleContext.Provider value={t ? workflowText(t) : inherited}>{children}</WorkflowLocaleContext.Provider>
}
export function useWorkflowText(t?: AgentTeamsTranslate): WorkflowText {
  const inherited = useContext(WorkflowLocaleContext)
  return t ? workflowText(t) : inherited
}
