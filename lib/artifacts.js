/**
 * Workspace byte identity: the only module in this plugin that reads artifact
 * bytes off disk.
 *
 * Two plugin surfaces need it:
 *  · a quality verdict must record which revision it judged (issue #161), so
 *    delivery can refuse to advertise bytes no review ever saw;
 *  · an auto-generated work order must record the workspace it was derived
 *    from (issue #174), so it can be marked stale after a later round edits a
 *    cited file.
 *
 * Safety rules this module must never lose:
 *  · directory traversal never follows symlinks, and every explicitly named
 *    path is resolved with `realpath` and rejected when it leaves the
 *    workspace — a symlink must not become a read of arbitrary host files, and
 *    a symlink cycle must not become an infinite walk;
 *  · a scope that cannot be enumerated completely (file cap, unreadable
 *    directory, non-workspace-relative path) produces an explicit
 *    {@link ArtifactScopeGap} instead of a short list that reads as complete;
 *  · "could not be read" is recorded separately from "does not exist";
 *  · plugins and secrets never enter a broad scope by accident.
 *
 * The gate rules themselves stay pure: they receive {@link ArtifactDigest}
 * values from here and never touch the filesystem.
 * @module dsh-agent-teams/artifacts
 */
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, opendirSync, readSync, realpathSync, statSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, sep } from 'node:path';
import { isDefaultExcludedPath, normalizeWorkspacePath } from "./quality-gates.js";
/** Bounded current-file preview. No directory/glob expansion, symlinks, or active document execution. */
export function readOutcomePreview(workspace, path) {
    const result = { path, status: 'blocked' };
    const normalized = normalizeWorkspacePath(path);
    if (!normalized || /[*?\[\]{}:\x00-\x1f]/.test(normalized) || normalized.split('/').some(s => /[. ]$/.test(s)) || isSkipped(normalized.toLowerCase()))
        return result;
    const root = workspaceRootOf(workspace);
    if (!root)
        return { ...result, status: 'unreadable' };
    let handle;
    try {
        let absolute = root;
        // Reject aliases too: a declared public symlink must not expose an excluded target.
        for (const segment of normalized.split('/')) {
            absolute = join(absolute, segment);
            if (lstatSync(absolute).isSymbolicLink())
                return result;
        }
        const canonical = realpathSync(absolute);
        if (!insideRoot(root, canonical) || isSkipped(relative(root, canonical).split(sep).join('/').toLowerCase()))
            return result;
        if (!lstatSync(canonical).isFile())
            return result;
        handle = openSync(canonical, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
        const stat = fstatSync(handle);
        if (!stat.isFile() || realpathSync(absolute) !== canonical)
            return result;
        const current = statSync(canonical);
        if (current.dev !== stat.dev || current.ino !== stat.ino)
            return result;
        result.size = stat.size;
        result.modifiedAt = stat.mtimeMs;
        const ext = normalized.toLowerCase().split('.').at(-1) ?? '';
        const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext];
        const textual = ['md', 'markdown', 'txt', 'csv', 'json', 'log', 'yaml', 'yml', 'toml', 'xml', 'html', 'htm', 'css', 'js', 'jsx', 'mjs', 'ts', 'tsx', 'py', 'sh', 'ps1', 'sql', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'ini'].includes(ext);
        if (!mime && !textual)
            return { ...result, status: 'unsupported' };
        const limit = mime ? 4 * 1024 * 1024 : 256 * 1024;
        if (mime && stat.size > limit)
            return { ...result, status: 'too_large' };
        const truncated = stat.size > limit;
        const buffer = Buffer.alloc(Math.min(stat.size, limit));
        let offset = 0;
        while (offset < buffer.length) {
            const n = readSync(handle, buffer, offset, buffer.length - offset, null);
            if (!n)
                break;
            offset += n;
        }
        const after = fstatSync(handle);
        if (offset !== buffer.length || statSignature(after) !== statSignature(stat) || statSignature(statSync(absolute)) !== statSignature(stat) || realpathSync(absolute) !== canonical)
            return { ...result, status: 'unreadable' };
        const sha256 = createHash('sha256').update(buffer).digest('hex');
        if (mime) {
            const signature = mime === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : mime === 'image/jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 : mime === 'image/gif' ? /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii')) : buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
            if (!signature)
                return { ...result, status: 'unsupported' };
            return { ...result, status: 'ready', kind: 'image', sha256, dataUrl: `data:${mime};base64,${buffer.toString('base64')}` };
        }
        let text;
        try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(buffer, { stream: truncated });
        }
        catch {
            return { ...result, status: 'unsupported' };
        }
        if (text.includes('\0'))
            return { ...result, status: 'unsupported' };
        return { ...result, status: 'ready', ...(truncated ? { truncated: true, previewBytes: buffer.length } : { sha256 }), kind: ['md', 'markdown'].includes(ext) ? 'markdown' : ext === 'csv' ? 'csv' : 'text', text };
    }
    catch (error) {
        return { ...result, status: ['ENOENT', 'ENOTDIR'].includes(errorCode(error)) ? 'missing' : 'unreadable' };
    }
    finally {
        if (handle !== undefined)
            closeSync(handle);
    }
}
/**
 * Directory segments never walked when a scope pattern names a directory:
 * version control, the harness state root, plugin-private team state, and
 * installed packages. They are either huge, plugin-private, or not project
 * artifacts.
 */
const SKIPPED_SEGMENTS = new Set(['.git', '.dsh', '.agent-teams', 'node_modules']);
/**
 * Upper bound on files expanded from one scope. Verdicts are about a revision
 * and an unbounded walk of a large tree would make every gate close slow, so
 * the walk stops here — and says so with a gap, because a silently truncated
 * list would let a change outside the list pass as "unchanged".
 */
export const MAX_EXPANDED_ARTIFACTS = 200;
export const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
export const MAX_SCOPE_BYTES = 32 * 1024 * 1024;
export const ARTIFACT_CACHE_TTL_MS = 5_000;
const ARTIFACT_CACHE_LIMIT = 1_024;
const ARTIFACT_EXTENSIONS = new Set('md markdown txt rst csv tsv json jsonl yaml yml toml xml html htm css scss less js jsx mjs cjs ts tsx mts cts py pyi sh bash zsh ps1 sql rs go java kt kts c cpp cc cxx h hpp cs rb php swift vue svelte ini cfg conf properties lock log svg png jpg jpeg gif webp ico pdf docx xlsx pptx'.split(' '));
const ARTIFACT_NAMES = new Set(['dockerfile', 'makefile', 'license', 'licence', 'notice', 'readme', '.gitignore', '.gitattributes', '.editorconfig']);
const digestCache = new Map();
function statSignature(stat) {
    return [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');
}
function errorCode(error) {
    const code = error?.code;
    return typeof code === 'string' ? code : 'EIO';
}
function workspaceRootOf(workspace) {
    try {
        return realpathSync(workspace);
    }
    catch {
        return undefined;
    }
}
/** Is `absolute` (already resolved) inside the workspace root? */
function insideRoot(root, absolute) {
    const rel = relative(root, absolute);
    return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}
/** `true` inside, `false` escapes the workspace, `undefined` unresolvable. */
function resolvesInside(root, absolute) {
    try {
        return insideRoot(root, realpathSync(absolute));
    }
    catch {
        return undefined;
    }
}
/**
 * Chunk size for bounded, on-demand streaming digests.
 */
const HASH_CHUNK_BYTES = 64 * 1024;
/**
 * sha256 one file in constant memory (one reusable chunk buffer), never
 * loading the whole artifact. Throws the underlying filesystem error so the
 * caller can distinguish "cannot read" from "absent".
 */
function hashFileConstantMemory(absolute, expected, budget) {
    const signature = statSignature(expected);
    const cached = digestCache.get(absolute);
    const now = Date.now();
    if (budget.cache && cached && cached.signature === signature && now >= cached.at && now - cached.at < ARTIFACT_CACHE_TTL_MS) {
        digestCache.delete(absolute);
        digestCache.set(absolute, cached);
        budget.remaining -= cached.size;
        return cached;
    }
    digestCache.delete(absolute);
    const handle = openSync(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    try {
        const before = fstatSync(handle);
        if (!before.isFile() || statSignature(before) !== signature)
            throw new Error('file changed before reading');
        const hash = createHash('sha256');
        const buffer = Buffer.allocUnsafe(HASH_CHUNK_BYTES);
        let size = 0;
        while (size < expected.size) {
            const read = readSync(handle, buffer, 0, Math.min(buffer.byteLength, expected.size - size), null);
            if (read <= 0)
                break;
            size += read;
            budget.remaining -= read;
            // `update` consumes the bytes synchronously, so the buffer is reused.
            hash.update(read === buffer.byteLength ? buffer : buffer.subarray(0, read));
        }
        if (size !== expected.size || statSignature(fstatSync(handle)) !== signature || statSignature(statSync(absolute)) !== signature)
            throw new Error('file changed while reading');
        const result = { sha256: hash.digest('hex'), size };
        if (budget.cache) {
            for (const [key, entry] of digestCache)
                if (now - entry.at >= ARTIFACT_CACHE_TTL_MS || now < entry.at)
                    digestCache.delete(key);
            if (digestCache.size >= ARTIFACT_CACHE_LIMIT)
                digestCache.delete(digestCache.keys().next().value);
            digestCache.set(absolute, { ...result, signature, at: now });
        }
        return result;
    }
    finally {
        closeSync(handle);
    }
}
function inspectPath(workspaceRoot, workspace, normalized, budget) {
    const absolute = join(workspace, normalized);
    let stats;
    try {
        stats = lstatSync(absolute);
    }
    catch (error) {
        const code = errorCode(error);
        return code === 'ENOENT' || code === 'ENOTDIR'
            ? { kind: 'absent' }
            : { kind: 'unreadable', reason: `${normalized} cannot be inspected (${code})` };
    }
    if (workspaceRoot === undefined) {
        return { kind: 'unreadable', reason: `${normalized} cannot be verified against the workspace root` };
    }
    // Containment is checked on the fully resolved path, not only when the last
    // segment is a symlink: an intermediate symlinked directory would otherwise
    // let any inner path read (or walk) host files outside the workspace.
    const inside = resolvesInside(workspaceRoot, absolute);
    if (inside === undefined)
        return { kind: 'unreadable', reason: `${normalized} cannot be resolved (broken or cyclic link)` };
    if (!inside)
        return { kind: 'unreadable', reason: `${normalized} resolves outside the workspace; refusing to read it` };
    if (stats.isSymbolicLink()) {
        try {
            stats = statSync(absolute);
        }
        catch (error) {
            return { kind: 'unreadable', reason: `${normalized} symlink target cannot be inspected (${errorCode(error)})` };
        }
    }
    if (stats.isDirectory())
        return { kind: 'directory' };
    if (!stats.isFile())
        return { kind: 'unreadable', reason: `${normalized} is not a regular file` };
    try {
        const canonical = realpathSync(absolute);
        if (!insideRoot(workspaceRoot, canonical))
            return { kind: 'unreadable', reason: `${normalized} resolves outside the workspace` };
        const supported = (path) => ARTIFACT_EXTENSIONS.has(extname(path).slice(1).toLowerCase()) || ARTIFACT_NAMES.has(basename(path).toLowerCase());
        const refused = (skipped, reason) => ({ kind: 'file', digest: { path: normalized, present: true, skipped, reason: `${normalized}: ${reason}`, size: stats.size, mtimeMs: stats.mtimeMs } });
        if (!supported(normalized) || !supported(canonical))
            return refused('type', 'unsupported artifact file type; content not audited');
        if (stats.size > MAX_ARTIFACT_BYTES)
            return refused('size', `exceeds the ${MAX_ARTIFACT_BYTES}-byte file limit; content not audited`);
        if (stats.size > budget.remaining)
            return refused('budget', `exceeds the ${MAX_SCOPE_BYTES}-byte scope budget; content not audited`);
        const { sha256, size } = hashFileConstantMemory(canonical, stats, budget);
        return {
            kind: 'file',
            digest: {
                path: normalized,
                present: true,
                sha256,
                size,
                mtimeMs: stats.mtimeMs,
            },
        };
    }
    catch (error) {
        return { kind: 'unreadable', reason: `${normalized} cannot be read (${errorCode(error)})` };
    }
}
function isSkipped(relativePath) {
    return relativePath.split('/').some((segment) => SKIPPED_SEGMENTS.has(segment)) || isDefaultExcludedPath(relativePath);
}
function walkDirectory(input) {
    // The prefix itself must be inside the workspace before it is enumerated:
    // `escape/` may be a symlink to an outside directory, and readdir would
    // happily list host names through it. Nested prefixes come from
    // non-symlink directory entries of an already-verified parent.
    if (input.prefix !== '') {
        if (input.workspaceRoot === undefined) {
            input.gap(`${input.pattern}: the workspace root cannot be resolved, so it is not enumerated`);
            return;
        }
        let inside;
        try {
            inside = insideRoot(input.workspaceRoot, realpathSync(join(input.workspace, input.prefix)));
        }
        catch (error) {
            if (errorCode(error) === 'ENOENT' || errorCode(error) === 'ENOTDIR') {
                input.gap(`${input.pattern}: ${input.prefix} does not exist, so the scope could not be enumerated`);
                return;
            }
            inside = undefined;
        }
        if (inside === undefined) {
            input.gap(`${input.pattern}: ${input.prefix} cannot be resolved (broken or cyclic link); refusing to enumerate it`);
            return;
        }
        if (!inside) {
            input.gap(`${input.pattern}: ${input.prefix} resolves outside the workspace; refusing to enumerate it`);
            return;
        }
    }
    const queue = input.prefix === '' ? [''] : [input.prefix];
    while (queue.length > 0) {
        const current = queue.shift();
        let entries;
        try {
            const absolute = join(input.workspace, current);
            if (!input.workspaceRoot || !insideRoot(input.workspaceRoot, realpathSync(absolute))) {
                input.gap(`${input.pattern}: directory no longer resolves inside the workspace`);
                return;
            }
            const directory = opendirSync(absolute);
            entries = [];
            try {
                for (;;) {
                    const entry = directory.readSync();
                    if (!entry)
                        break;
                    if (input.scan.remaining-- <= 0) {
                        input.gap(`${input.pattern}: directory scan limit reached; scope is only partially recorded`);
                        return;
                    }
                    entries.push(entry);
                }
            }
            finally {
                directory.closeSync();
            }
        }
        catch (error) {
            input.gap(`${input.pattern}: cannot list ${current === '' ? '.' : current} (${errorCode(error)})`);
            continue;
        }
        for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
            const relativePath = `${current === '' ? '' : `${current}/`}${entry.name}`;
            // Traversal never follows symlinks: a symlinked directory can point
            // outside the workspace or form a cycle, and neither may become a read
            // or an unbounded walk.
            if (entry.isSymbolicLink())
                continue;
            if (isSkipped(relativePath))
                continue;
            if (entry.isDirectory()) {
                queue.push(relativePath);
                continue;
            }
            if (!entry.isFile())
                continue;
            if (input.full(relativePath)) {
                input.gap(`${input.pattern}: stopped at the ${MAX_EXPANDED_ARTIFACTS}-file cap, so its contents are only partially recorded`);
                return;
            }
            input.push(relativePath);
        }
    }
}
/**
 * Read a declared scope: expand directory patterns to their current files,
 * keep explicitly named paths even when they do not exist (a later creation is
 * drift too), and report every part that could not be fully resolved.
 */
export function readArtifactScope(workspace, patterns, options = {}) {
    const budget = { remaining: MAX_SCOPE_BYTES, cache: options.cache === true };
    const scan = { remaining: 10000 };
    const workspaceRoot = workspaceRootOf(workspace);
    const gaps = [];
    const concrete = [];
    const seen = new Set();
    const scopes = new Set();
    const full = (path) => concrete.length >= MAX_EXPANDED_ARTIFACTS && !(path && seen.has(path));
    const push = (path) => {
        if (seen.has(path))
            return;
        seen.add(path);
        concrete.push(path);
    };
    const gap = (pattern, reason) => {
        if (gaps.some((item) => item.pattern === pattern && item.reason === reason))
            return;
        gaps.push({ pattern, reason });
    };
    for (const raw of [...new Set(patterns)].sort()) {
        if (typeof raw !== 'string')
            continue;
        const trimmed = raw.trim();
        const posix = trimmed.replaceAll('\\', '/');
        let directory = posix.endsWith('/') || posix === '.';
        const normalized = normalizeWorkspacePath(raw);
        if (normalized === undefined) {
            // Absolute paths, `..`, `~`, drive letters: illegal, and never a reason
            // to fall back to the workspace root.
            gap(trimmed, 'not a workspace-relative path (absolute paths and ".." can never match scope)');
            continue;
        }
        // Resolve bare directory declarations before spending the content budget.
        // Failures still go through inspectPath below for precise error reporting.
        if (!directory && normalized) {
            try {
                directory = statSync(join(workspace, normalized)).isDirectory();
            }
            catch { /* inspect below */ }
        }
        const scopeKey = `${directory ? 'directory' : 'file'}:${normalized}`;
        if (scopes.has(scopeKey))
            continue;
        scopes.add(scopeKey);
        if (!directory) {
            if (normalized === '') {
                gap(trimmed, 'empty path is not a file; use "." for the whole workspace');
                continue;
            }
            if (full(normalized)) {
                gap(trimmed, `stopped at the ${MAX_EXPANDED_ARTIFACTS}-path cap, so the scope is only partially recorded`);
                continue;
            }
            push(normalized);
            continue;
        }
        // Only an explicitly root-anchored pattern means the workspace root.
        const rootAnchored = posix === '.' || posix === './' || posix.startsWith('./');
        if (normalized === '' && !rootAnchored) {
            gap(trimmed, 'unresolved directory pattern; use "./" explicitly for the workspace root');
            continue;
        }
        walkDirectory({ workspace, workspaceRoot, pattern: trimmed, prefix: normalized, push, gap: (reason) => gap(trimmed, reason), full, scan });
    }
    const artifacts = [];
    // The same declared file set must bind the same bytes regardless of input order.
    for (const normalized of concrete.sort()) {
        const outcome = inspectPath(workspaceRoot, workspace, normalized, budget);
        if (outcome.kind === 'file') {
            artifacts.push(outcome.digest);
            continue;
        }
        if (outcome.kind === 'directory') {
            gap(normalized, 'path became a directory during the audit; refresh the scope');
            continue;
        }
        if (outcome.kind === 'absent') {
            artifacts.push({ path: normalized, present: false });
            continue;
        }
        artifacts.push({ path: normalized, present: false, unreadable: true, reason: outcome.reason,
            ...(outcome.size === undefined ? {} : { size: outcome.size, mtimeMs: outcome.mtimeMs }),
        });
    }
    return { artifacts: artifacts.sort((a, b) => a.path.localeCompare(b.path)), gaps };
}
/**
 * Read the current bytes of workspace-relative paths (directories expand).
 * Illegal and unreadable paths are reported, never silently dropped.
 */
export function digestWorkspacePaths(workspace, paths) {
    return readArtifactScope(workspace, paths).artifacts;
}
/**
 * Does this workspace-relative path currently exist as a file or directory?
 * Uses the same containment rules as the digest reader: a symlink that leaves
 * the workspace is not "an existing workspace path".
 */
export function workspacePathExists(workspace, path) {
    const normalized = normalizeWorkspacePath(path);
    if (normalized === undefined)
        return false;
    const root = workspaceRootOf(workspace);
    if (!root)
        return false;
    try {
        const absolute = realpathSync(join(workspace, normalized));
        if (!insideRoot(root, absolute))
            return false;
        const stat = statSync(absolute);
        return stat.isFile() || stat.isDirectory();
    }
    catch {
        return false;
    }
}
/** Expand scope patterns to the concrete files they currently cover. */
export function expandScopePaths(workspace, patterns) {
    return readArtifactScope(workspace, patterns)
        .artifacts
        .filter((artifact) => artifact.present)
        .map((artifact) => artifact.path)
        .sort();
}
/**
 * Read one coherent snapshot of the given scope patterns. Directory patterns
 * expand to the files they currently contain; a pattern naming a path that
 * does not exist is recorded as `present: false` so a later creation or
 * deletion is visible as drift, and any incomplete coverage is carried in
 * `gaps`.
 */
export function snapshotWorkspacePaths(workspace, patterns) {
    const at = Date.now();
    const { artifacts, gaps } = readArtifactScope(workspace, patterns);
    return { at, artifacts, ...gaps.length === 0 ? {} : { gaps } };
}
