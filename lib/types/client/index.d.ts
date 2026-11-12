/** Browser plugin for the TeamFlow canvas shortcut and conversation card. */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type AgentTeamsLocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'teamflow.super-agent.panel.chat': {
            kind: 'single';
            scope: 'session';
        };
        'teamflow.super-agent.overlay.chat': {
            kind: 'single';
            scope: 'session';
        };
    }
    interface LocaleNamespaceMap {
        /** AgentTeams conversation card and activity monitor copy. */
        agentTeams: AgentTeamsLocaleKey;
    }
}
/** Required services: conversation nodes, slots, sessions navigation, and locale. */
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
