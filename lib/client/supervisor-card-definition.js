import { readCard } from "../super-agent-card.js";
export const supervisorDefinition = {
    kind: 'teamflow-supervisor', target: 'chat',
    match: event => { const r = readCard(event); return r ? { id: r.card.key, role: r.revision } : null; },
    start: (_ctx, m) => readCard(m.event).card,
    update: (_ctx, m) => readCard(m.event).card,
    buildViewNode: c => c.start ? { kind: 'teamflow-supervisor', key: c.key, id: c.id, target: 'chat', anchorSeq: c.start.event.seq, location: c.start.location, visibility: 'visible', data: c.state } : null,
};
