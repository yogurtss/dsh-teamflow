import { parentPort } from 'node:worker_threads';
import { auditTeamWorkspace } from "./workspace-audit.js";
import { readArtifactScope } from "./artifacts.js";
parentPort?.on('message', ({ id, workspace, team, paths, cache }) => {
    try {
        const result = paths ? readArtifactScope(workspace, paths, { cache }) : auditTeamWorkspace(workspace, team);
        parentPort.postMessage({ id, result });
    }
    catch (error) {
        parentPort.postMessage({ id, error: String(error) });
    }
});
