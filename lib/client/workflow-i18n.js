import { jsx as _jsx } from "react/jsx-runtime";
/** Workflow UI locale follows the host; user content is never translated implicitly. */
import { createContext, useContext } from 'react';
import { workflowText, sourceText } from "./workflow-text.js";
export { workflowText, sourceText } from "./workflow-text.js";
const WorkflowLocaleContext = createContext(sourceText);
export function WorkflowLocale({ t, children }) {
    const inherited = useContext(WorkflowLocaleContext);
    return _jsx(WorkflowLocaleContext.Provider, { value: t ? workflowText(t) : inherited, children: children });
}
export function useWorkflowText(t) {
    const inherited = useContext(WorkflowLocaleContext);
    return t ? workflowText(t) : inherited;
}
