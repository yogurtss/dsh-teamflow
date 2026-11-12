import { MAX_WORKFLOW_TEXT_LENGTH } from "./workflow-types.js";
import { sessionOwnEvents } from "./harness-compat.js";
const history = new WeakMap();
/** The host's append-only seq is the log length, not a time or token count.
 * Keep only the displayed tail; do not retain another complete transcript.
 * Legacy hosts without that contract always read fresh events.
 */
export function discussionHistory(session) {
    const seq = session.seq;
    const cached = history.get(session);
    if (typeof seq === 'number' && cached?.seq === seq)
        return cached.messages;
    const events = sessionOwnEvents(session), messages = [];
    for (let i = events.length - 1; i >= 0 && messages.length < 100; i--) {
        const event = events[i];
        const message = event.type === 'user/message' ? event.data : event.type === 'assistant/message' ? event.data.message : undefined;
        if (!message || (event.type === 'user/message' && message.source.kind !== 'user'))
            continue;
        const text = message.content.filter(block => block.type === 'text').map(block => block.text).join('\n').trim();
        if (text)
            messages.push({ id: String(event.seq), role: event.type === 'user/message' ? 'user' : 'assistant', text });
    }
    messages.reverse();
    // Oversized messages remain readable, but are not duplicated in a cache.
    if (typeof seq === 'number' && messages.reduce((size, m) => size + m.text.length, 0) <= 262144)
        history.set(session, { seq, messages });
    else
        history.delete(session);
    return messages;
}
export const partialRequirementsNotice = '仅带入最近的部分对话需求，请核对并补充较早的要求。';
/** Copy the latest user-authored text within the editable goal's capacity. */
export function recentUserRequirements(session) {
    const events = sessionOwnEvents(session);
    const parts = [];
    let room = MAX_WORKFLOW_TEXT_LENGTH;
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.type !== 'user/message' || event.data.source.kind !== 'user')
            continue;
        const blocks = event.data.content;
        for (let j = blocks.length - 1; j >= 0; j--) {
            const block = blocks[j];
            if (block.type !== 'text' || !block.text)
                continue;
            if (parts.length)
                room--;
            if (room < block.text.length) {
                if (room > 0) {
                    let start = block.text.length - room;
                    const first = block.text.charCodeAt(start);
                    if (first >= 0xdc00 && first <= 0xdfff)
                        start++;
                    if (start < block.text.length)
                        parts.push(block.text.slice(start));
                }
                return { text: parts.reverse().join('\n'), partial: true };
            }
            parts.push(block.text);
            room -= block.text.length;
        }
    }
    return { text: parts.reverse().join('\n'), partial: false };
}
