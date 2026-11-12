/** Automatic archive nodes are system-owned and execute after their inputs complete. */
export interface TaskArchiveConfig {
    copyFiles: boolean;
    paths: string[];
}
export interface TaskArchiveRecord {
    id: string;
    createdAt: number;
    manifestPath: string;
    sha256: string;
    fileCount: number;
    copiedCount: number;
}
export declare const MAX_ARCHIVE_MANIFEST_BYTES: number;
export declare const taskArchiveParameter: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly copyFiles: {
            readonly type: "boolean";
            readonly description: "Copy supported, auditable files (2 MiB per file, 32 MiB total). Policy-excluded files retain metadata only. Default false: record hashes and evidence references only.";
        };
        readonly paths: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Workspace-relative file scope. Empty defaults to upstream deliverables and changed paths.";
        };
    };
};
export declare function parseTaskArchive(value: unknown): TaskArchiveConfig;
export declare function validArchiveFields(value: Record<string, unknown>): boolean;
