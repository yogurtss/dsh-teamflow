export const cardRecord = 'plugin:teamflow/super-agent-card';
export function readCard(event) {
    if (event.type !== cardRecord)
        return;
    const record = event.data;
    const c = record?.card;
    if (c && typeof c.key === 'string' && typeof c.captain === 'string' && typeof c.workspaceId === 'string' && typeof c.item?.title === 'string' && (record.revision === 'start' || record.revision === 'update'))
        return record;
}
