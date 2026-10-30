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
    specificContractVersion?: number;
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
/** New model-authored nodes must contain a reusable and an instance contract. */
export declare function requireGeneratedTaskLayers(operations: import('./workflow-types.ts').WorkflowOperation[]): void;
export declare const taskLayersParameter: {
    readonly type: "object";
    readonly description: "Generate both layers when creating tasks: general is the reusable method and quality constraints; specific is the COMPLETE standalone execution contract, concretizing every general method, deliverable and acceptance constraint for the current goal, paths and parameters. Executors see only specific, never general; do not use references such as follow the general requirements. Each has requirements, deliverables, acceptance strings. Do not duplicate layers in description.";
    readonly additionalProperties: false;
    readonly properties: {
        readonly general: {
            readonly required: true;
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly requirements: {
                    readonly type: "string";
                    readonly required: true;
                };
                readonly deliverables: {
                    readonly type: "string";
                    readonly required: true;
                };
                readonly acceptance: {
                    readonly type: "string";
                    readonly required: true;
                };
            };
        };
        readonly specific: {
            readonly required: true;
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly requirements: {
                    readonly type: "string";
                    readonly required: true;
                };
                readonly deliverables: {
                    readonly type: "string";
                    readonly required: true;
                };
                readonly acceptance: {
                    readonly type: "string";
                    readonly required: true;
                };
            };
        };
    };
};
