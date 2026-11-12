export declare function workflowRequest<T>(payload: Record<string, unknown>, fetcher?: typeof fetch, timeoutMs?: number | null, signal?: AbortSignal): Promise<T>;
