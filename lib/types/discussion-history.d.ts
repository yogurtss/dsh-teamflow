import type { Session } from '@deepseek-ai/dsh-session';
type Message = {
    id: string;
    role: string;
    text: string;
};
/** The host's append-only seq is the log length, not a time or token count.
 * Keep only the displayed tail; do not retain another complete transcript.
 * Legacy hosts without that contract always read fresh events.
 */
export declare function discussionHistory(session: Session): Message[];
export declare const partialRequirementsNotice = "\u4EC5\u5E26\u5165\u6700\u8FD1\u7684\u90E8\u5206\u5BF9\u8BDD\u9700\u6C42\uFF0C\u8BF7\u6838\u5BF9\u5E76\u8865\u5145\u8F83\u65E9\u7684\u8981\u6C42\u3002";
/** Copy the latest user-authored text within the editable goal's capacity. */
export declare function recentUserRequirements(session: Session): {
    text: string;
    partial: boolean;
};
export {};
