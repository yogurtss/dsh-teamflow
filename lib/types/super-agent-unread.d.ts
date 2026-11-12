import type { SessionEvent } from '@deepseek-ai/dsh-session/types';
/** Count visible incoming chat entries. Revisions of one card occupy one slot. */
export declare function conversationUnread(events: readonly SessionEvent[], through?: number): {
    count: number;
    latest: number;
};
