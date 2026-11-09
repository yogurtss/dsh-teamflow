export const taskArchiveParameter = { type: 'object', additionalProperties: false, properties: { copyFiles: { type: 'boolean', description: 'Copy declared files (up to 100 MiB). Default false: record hashes and evidence references only.' }, paths: { type: 'array', items: { type: 'string' }, description: 'Workspace-relative file scope. Empty defaults to upstream deliverables and changed paths.' } } };
export function parseTaskArchive(value) {
    if (value === undefined)
        return { copyFiles: false, paths: [] };
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('归档配置必须是对象');
    const v = value;
    if (v['copyFiles'] !== undefined && typeof v['copyFiles'] !== 'boolean')
        throw new Error('copyFiles 必须是布尔值');
    const paths = v['paths'] ?? [];
    if (!Array.isArray(paths) || paths.length > 100 || paths.some(p => typeof p !== 'string' || !p.trim() || p.length > 1000))
        throw new Error('归档路径必须是最多 100 项的相对路径列表');
    return { copyFiles: v['copyFiles'] === true, paths: [...new Set(paths.map(p => p.trim()))] };
}
export function validArchiveFields(value) {
    try {
        if (value['archive'] !== undefined) {
            if (value['kind'] !== 'archive')
                return false;
            parseTaskArchive(value['archive']);
        }
        if (value['kind'] === 'archive' && (value['assignee'] || value['checkpoint']))
            return false;
        if (value['archiveRecords'] !== undefined && (!Array.isArray(value['archiveRecords']) || !value['archiveRecords'].every((r) => r && /^[a-f0-9-]{36}$/.test(r.id) && Number.isFinite(r.createdAt) && typeof r.manifestPath === 'string' && /^[a-f0-9]{64}$/.test(r.sha256) && Number.isSafeInteger(r.fileCount) && r.fileCount >= 0 && Number.isSafeInteger(r.copiedCount) && r.copiedCount >= 0)))
            return false;
        return true;
    }
    catch {
        return false;
    }
}
