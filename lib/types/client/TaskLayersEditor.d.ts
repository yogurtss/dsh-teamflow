import type { TaskLayers } from '../task-layers.ts';
export declare function TaskLayersView({ layers, issue }: {
    layers: TaskLayers;
    issue?: string;
}): import("react").JSX.Element;
export declare function TaskLayersEditor({ values, onChange, hasGeneral, issue }: {
    values: Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    hasGeneral?: boolean;
    issue?: boolean;
}): import("react").JSX.Element;
