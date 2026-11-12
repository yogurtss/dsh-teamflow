/** Browser plugin for the TeamFlow canvas shortcut and conversation card. */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type AgentTeamsLocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** AgentTeams conversation card and activity monitor copy. */
        agentTeams: AgentTeamsLocaleKey;
    }
}
/** Required services: conversation nodes, slots, sessions navigation, and locale. */
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
