import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
export interface RelayTarget {
    workspaceId: string;
    project: string;
    teamId: string;
    workflow: string;
    captain: string;
    conversation?: string;
}
export declare function resolveRelayTarget(targets: RelayTarget[], name: string, project: string | undefined): RelayTarget;
/** Match the exact inbox entry, even when the Captain fails during prompt assembly before user/message. */
export declare function requirementTurn(events: readonly SessionEvent[], marker: string): {
    accepted: boolean;
    end: string | undefined;
    text: string;
};
/** The active file is the outbox. Keep terminal receipts outside the polling directory for retry deduplication. */
export declare function createRequirementRelay(ctx: Context, home: string, stateDir: string, workspacePath: (id: string) => string | undefined, chat: () => Promise<Agent>, currentChatId: () => string): {
    queue: (target: RelayTarget, session: string, seq: number, instruction: string) => Promise<{
        id: string;
        project: string;
        workflow: string;
        status: string;
    }>;
    answer: (id: string, round: number, text: string) => Promise<void>;
    pass: () => Promise<void>;
};
