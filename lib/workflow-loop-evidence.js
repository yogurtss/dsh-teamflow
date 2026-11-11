import { resultDigest } from "./review-results.js";
/** The existing wire field binds the submitted results for this round. */
export function loopArtifactEvidence(_workspace, team, loop) {
    return resultDigest(team.tasks.filter(task => loop.bodyIds.includes(task.id)));
}
