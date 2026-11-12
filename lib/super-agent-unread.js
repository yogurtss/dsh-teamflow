import { readCard } from "./super-agent-card.js";
/** Count visible incoming chat entries. Revisions of one card occupy one slot. */
export function conversationUnread(events, through = -1) {
    const cards = new Map();
    let count = 0;
    let latest = -1;
    for (const event of events) {
        const card = readCard(event);
        if (card) {
            cards.set(card.card.key, event.seq);
        }
        else if (event.type === 'assistant/message' && event.data.message.content.some(block => block.type === 'text' && block.text.trim())) {
            if (event.seq > through)
                count++;
        }
        else {
            continue;
        }
        latest = Math.max(latest, event.seq);
    }
    for (const seq of cards.values()) {
        if (seq > through)
            count++;
    }
    return { count, latest };
}
