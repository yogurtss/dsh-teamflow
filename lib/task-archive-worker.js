import { parentPort, workerData } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, renameSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readArtifactScope } from "./artifacts.js";
try {
    const { root, workspace, teamId, taskId, subject, id, createdAt, source, sourceFingerprint } = workerData;
    const paths = source.config.paths.length ? source.config.paths : [...new Set(source.tasks.flatMap(t => [...t.changedPaths ?? [], ...t.deliverables ?? []]))];
    const scope = readArtifactScope(workspace, paths);
    if (scope.gaps.length || scope.artifacts.some(f => f.unreadable))
        throw new Error('归档文件范围无法完整读取，请检查路径或缩小范围');
    const destination = join(root, teamId, 'artifacts', id), staging = destination + '.partial';
    mkdirSync(staging, { recursive: true });
    let copiedCount = 0, totalBytes = 0;
    const canonicalRoot = realpathSync(workspace);
    const files = scope.artifacts.map(file => {
        if (!source.config.copyFiles || !file.present)
            return { ...file, copied: false };
        totalBytes += file.size ?? 0;
        if (totalBytes > 100 * 1024 * 1024)
            throw new Error('文件副本超过 100 MiB，请缩小归档范围');
        let absolute = canonicalRoot;
        for (const segment of file.path.split('/')) {
            absolute = join(absolute, segment);
            if (lstatSync(absolute).isSymbolicLink())
                throw new Error('归档副本不接受符号链接');
        }
        const canonical = realpathSync(absolute), rel = relative(canonicalRoot, canonical);
        if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel))
            throw new Error('归档文件超出工作区');
        const input = openSync(canonical, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
        let output;
        try {
            const before = fstatSync(input), current = statSync(canonical);
            if (!before.isFile() || before.ino !== current.ino || before.dev !== current.dev || before.size !== file.size)
                throw new Error('归档文件已变化');
            const target = join(staging, 'files', file.path);
            mkdirSync(dirname(target), { recursive: true });
            output = openSync(target, 'wx');
            const chunk = Buffer.allocUnsafe(64 * 1024), hash = createHash('sha256');
            let bytes = 0;
            for (;;) {
                const n = readSync(input, chunk, 0, chunk.length, null);
                if (!n)
                    break;
                bytes += n;
                if (bytes > 100 * 1024 * 1024)
                    throw new Error('归档文件过大');
                hash.update(chunk.subarray(0, n));
                let written = 0;
                while (written < n)
                    written += writeSync(output, chunk, written, n - written);
            }
            const after = fstatSync(input);
            if (hash.digest('hex') !== file.sha256 || bytes !== before.size || after.mtimeMs !== before.mtimeMs || realpathSync(absolute) !== canonical)
                throw new Error('归档期间文件发生变化，请重试');
        }
        finally {
            closeSync(input);
            if (output !== undefined)
                closeSync(output);
        }
        copiedCount++;
        return { ...file, copied: true, copyPath: 'files/' + file.path };
    });
    let gitCommit;
    try {
        const value = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workspace, encoding: 'utf8', timeout: 2000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (/^[a-f0-9]{40,64}$/.test(value))
            gitCommit = value;
    }
    catch { /* Non-Git workspaces still have attempt IDs and content hashes. */ }
    const manifest = { version: 1, id, teamId, taskId, subject, createdAt, sourceFingerprint, gitCommit, gitNote: 'HEAD is a reference only; file hashes identify the archived working-tree bytes.', config: source.config, tasks: source.tasks, loops: source.loops, files };
    const raw = JSON.stringify(manifest, null, 2) + '\n';
    if (Buffer.byteLength(raw) > 20 * 1024 * 1024)
        throw new Error('归档清单超过 20 MiB，请缩小上游范围');
    writeFileSync(join(staging, 'manifest.json'), raw, { flag: 'wx' });
    renameSync(staging, destination);
    parentPort?.postMessage({ record: { id, createdAt, manifestPath: 'artifacts/' + id + '/manifest.json', sha256: createHash('sha256').update(raw).digest('hex'), fileCount: files.length, copiedCount } });
}
catch (error) {
    parentPort?.postMessage({ error: error instanceof Error ? error.message : '归档失败' });
}
