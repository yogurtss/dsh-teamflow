export async function resolveActivitySession(sessionId, signal, fetchState = fetch) {
    const fallback = { sessionId, owner: sessionId };
    if (!sessionId.startsWith('session-at-discussion-'))
        return fallback;
    const response = await fetchState('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, action: 'state' }), signal });
    if (!response.ok)
        return fallback;
    const value = await response.json();
    const owner = value.team?.captainSessionId;
    if (!value.currentDiscussion || typeof owner !== 'string' || !owner)
        return fallback;
    return { sessionId, owner, ...value.activity?.captainSessionId === owner ? { activity: value.activity } : {} };
}
