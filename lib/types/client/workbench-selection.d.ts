/** One selected object owns the property panel; drafts survive navigation. */
import type { TeamState } from '../types.ts';
export type EditorTarget = {
    type: 'member' | 'task' | 'check';
    id?: string;
};
export type WorkbenchTarget = EditorTarget | {
    type: 'edge';
    from: string;
    to: string;
} | {
    type: 'discussion';
    key: string;
};
export type EditorDraft = {
    values: Record<string, string>;
    source: string;
};
export type WorkbenchView = {
    target: WorkbenchTarget;
    revision: number;
    drafts: Record<string, EditorDraft>;
};
export declare const initialWorkbenchView: () => WorkbenchView;
export declare const editorKey: (teamId: string, target: EditorTarget) => string;
export declare function editorTarget(team: TeamState | undefined, target: WorkbenchTarget): EditorTarget | undefined;
export declare function targetDiscussion(target: WorkbenchTarget): string;
export declare function draftSource(team: TeamState | undefined, target: EditorTarget): string;
export declare function initialEditorDraft(team: TeamState | undefined, target: EditorTarget): EditorDraft;
export declare function selectWorkbench(view: WorkbenchView, target: WorkbenchTarget, team: TeamState | undefined, overrides?: Record<string, string>): WorkbenchView;
/** A late save may clear only the exact draft it submitted, never newer typing. */
export declare function finishWorkbenchSave(view: WorkbenchView, key: string | undefined, submitted: EditorDraft | undefined, revision: number, team: TeamState, nextTarget?: WorkbenchTarget, submittedTarget?: EditorTarget): WorkbenchView;
