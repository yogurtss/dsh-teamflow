/** Personal, cross-workspace library; immutable versions and atomic writes. */
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isBuiltinTemplate, parseTemplate } from "./templates.js";
export const templateLibraryRoot = (directory) => directory ? resolve(directory) : join(homedir(), '.dsh-teamflow', 'templates');
function templateId(id) {
    if (!/^[a-f0-9-]{36}$/.test(id))
        throw new Error('无效模板 ID');
    return id;
}
async function read(root, id) {
    const raw = await readFile(join(root, `${templateId(id)}.json`), 'utf8');
    const value = JSON.parse(raw);
    if (value.id !== id || !Array.isArray(value.versions) || !value.versions.length)
        throw new Error('模板记录已损坏');
    for (const [index, v] of value.versions.entries()) {
        if (v.id !== id || v.version !== index + 1 || !Number.isFinite(v.createdAt) || !Number.isFinite(v.updatedAt))
            throw new Error('模板版本记录已损坏');
        parseTemplate(v);
    }
    return value;
}
async function locked(root, run) {
    await mkdir(root, { recursive: true });
    const lock = join(root, '.write-lock'), deadline = Date.now() + 5000;
    while (true) {
        try {
            await mkdir(lock);
            break;
        }
        catch (error) {
            if (error.code !== 'EEXIST')
                throw error;
            if (Date.now() > deadline)
                throw new Error('模板库正被另一个进程写入；请稍后重试。如宿主异常退出，请确认无人写入后移除模板目录中的 .write-lock。');
            await new Promise(r => setTimeout(r, 50));
        }
    }
    try {
        return await run();
    }
    finally {
        await rm(lock, { recursive: true });
    }
}
export async function listTemplates(root) {
    let entries;
    try {
        entries = await readdir(root);
    }
    catch (e) {
        if (e.code === 'ENOENT')
            return { templates: [], warnings: [] };
        throw e;
    }
    const templates = [], warnings = [];
    for (const file of entries.filter(f => /^[a-f0-9-]{36}\.json$/.test(f))) {
        try {
            const value = await read(root, file.slice(0, -5));
            if (!value.deleted)
                templates.push(value.versions.at(-1));
        }
        catch {
            warnings.push(`无法读取模板 ${file}，原文件已保留。`);
        }
    }
    return { templates: templates.sort((a, b) => b.updatedAt - a.updatedAt), warnings };
}
export async function getTemplate(root, id, version) {
    const record = await read(root, id);
    if (record.deleted)
        throw new Error('模板已删除');
    const value = version === undefined ? record.versions.at(-1) : record.versions.find(v => v.version === version);
    if (!value)
        throw new Error('模板版本不存在');
    return value;
}
async function atomic(root, value) {
    const tmp = join(root, `${value.id}.${randomUUID()}.tmp`);
    try {
        await writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
        await rename(tmp, join(root, `${value.id}.json`));
    }
    finally {
        await rm(tmp, { force: true });
    }
}
export async function saveTemplate(root, definition, previous) {
    if (previous && isBuiltinTemplate(previous.id))
        throw new Error('内置模板只读，请另存为个人模板');
    const clean = parseTemplate(definition);
    if (clean.tasks.some(t => !t.general.requirements.trim()))
        throw new Error('请为每个节点填写通用任务要求');
    return locked(root, async () => {
        const record = previous ? await read(root, previous.id) : { id: randomUUID(), versions: [] };
        const latest = record.versions.at(-1);
        if (record.deleted || previous && latest?.version !== previous.version)
            throw new Error('模板已更新或删除，请重新打开后保存');
        const now = Date.now(), version = { ...clean, id: record.id, version: (latest?.version ?? 0) + 1, createdAt: latest?.createdAt ?? now, updatedAt: now };
        record.versions.push(version);
        await atomic(root, record);
        return version;
    });
}
export async function deleteTemplate(root, id, version) {
    if (isBuiltinTemplate(id))
        throw new Error('内置模板不能删除');
    await locked(root, async () => { const record = await read(root, id); if (record.deleted || record.versions.at(-1)?.version !== version)
        throw new Error('模板已变化，请刷新后重试'); record.deleted = true; await atomic(root, record); });
}
