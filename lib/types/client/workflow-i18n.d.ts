/** Workflow UI locale follows the host; user content is never translated implicitly. */
import { type ReactNode } from 'react';
import type { AgentTeamsTranslate } from './locales.ts';
import { type WorkflowText } from './workflow-text.ts';
export { workflowText, sourceText, type WorkflowText } from './workflow-text.ts';
export declare function WorkflowLocale({ t, children }: {
    t?: AgentTeamsTranslate;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useWorkflowText(t?: AgentTeamsTranslate): WorkflowText;
