/** Portable task contracts shared by the browser, persistence and execution. */
export interface TaskBrief {
    requirements: string;
    deliverables: string;
    acceptance: string;
}
export interface TaskLayers {
    general: TaskBrief;
    specific: TaskBrief;
}
export declare function taskNeedsConfiguration(task: {
    workflowConfigPending?: boolean;
    adaptationIssue?: string;
    layers?: TaskLayers;
}): boolean;
export declare const emptyBrief: () => TaskBrief;
export declare function isTaskBrief(value: unknown): value is TaskBrief;
export declare function isTaskLayers(value: unknown): value is TaskLayers;
export declare function parseBrief(value: unknown): TaskBrief;
export declare function parseLayers(value: unknown): TaskLayers;
export declare function briefText(value: TaskBrief): string;
export declare function taskText(task: {
    description?: string;
    layers?: TaskLayers;
}): string;
export declare function layersFromDraft(draft: Record<string, string>): TaskLayers;
