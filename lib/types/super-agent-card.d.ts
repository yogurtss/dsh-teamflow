import type { WatchItem } from './super-agent-watch.ts';
export declare const cardRecord = "plugin:teamflow/super-agent-card";
export interface SupervisorCard {
    key: string;
    workspaceId: string;
    project: string;
    teamId: string;
    workflow: string;
    captain: string;
    item: WatchItem | {
        kind: 'requirement';
        id: string;
        title: string;
        round?: undefined;
        taskId?: undefined;
    };
    summary: string;
    status: 'open' | 'approved' | 'rejected' | 'closed';
    requirement?: {
        id: string;
        round: number;
        kind: 'result' | 'question' | 'answered' | 'failed' | 'reply';
        instruction: string;
        answer?: string;
    };
}
export interface CardEvent {
    card: SupervisorCard;
    revision: 'start' | 'update';
}
declare module '@deepseek-ai/dsh-session/types' {
    interface PluginRecordMap {
        'plugin:teamflow/super-agent-card': CardEvent;
    }
}
export declare function readCard(event: {
    type: string;
    data: unknown;
}): CardEvent | undefined;
