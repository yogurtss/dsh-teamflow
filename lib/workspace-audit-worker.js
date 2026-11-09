import { parentPort } from 'node:worker_threads';
import { auditTeamWorkspace } from "./workspace-audit.js";
import { readArtifactScope, readOutcomePreview } from "./artifacts.js";
parentPort?.on('message', ({ id, workspace, team, paths, previewPath, cache }) => {
    try {
        const result = previewPath !== undefined ? readOutcomePreview(workspace, previewPath) : paths ? readArtifactScope(workspace, paths, { cache }) : auditTeamWorkspace(workspace, team);
        parentPort.postMessage({ id, result });
    }
    catch (error) {
        parentPort.postMessage({ id, error: String(error) });
    }
});
