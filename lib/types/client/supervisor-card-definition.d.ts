import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-ui-conversation/client';
import { type SupervisorCard } from '../super-agent-card.ts';
declare module '@deepseek-ai/dsh-client-ui-chat/client' {
    interface ChatNodeDataMap {
        'teamflow-supervisor': SupervisorCard;
    }
}
export declare const supervisorDefinition: ConversationNodeDefinition<SupervisorCard>;
