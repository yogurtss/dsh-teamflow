/** On-demand file work runs off the host event loop with bounded lifetime. */
import { Worker } from 'node:worker_threads'
import { createHash } from 'node:crypto'
import type { TeamState } from './types.ts'
import type { DeliveryAudit } from './quality-gates.ts'
import type { ArtifactScopeRead } from './artifacts.ts'
import type { OutcomePreview } from './outcomes.ts'
import { deliveryArtifactPaths, deliveryScopePatterns } from './quality-gates.ts'

export const WORKSPACE_AUDIT_TIMEOUT_MS = 3_000
export function createWorkspaceAuditor(options: { timeoutMs?: number } = {}) {
  let worker: Worker | undefined, sequence = 0, closed = false
  const pending = new Map<number, { resolve: (result: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>()
  const shared = new Map<string, Promise<unknown>>()
  const fail = (error: Error) => {
    for (const job of pending.values()) { clearTimeout(job.timer); job.reject(error) }
    pending.clear(); shared.clear()
  }
  const getWorker = () => {
    if (worker) return worker
    const current = new Worker(new URL('./workspace-audit-worker.js', import.meta.url))
    worker = current
    current.on('message', ({id,result,error}: {id:number;result:unknown;error?:string}) => {
      const job = pending.get(id)
      if (!job) return
      clearTimeout(job.timer); pending.delete(id)
      if (error) job.reject(new Error(error)); else job.resolve(result)
      if (!pending.size) current.unref()
    })
    current.on('error', error => { if(worker===current){worker=undefined;fail(error);void current.terminate()} })
    current.on('exit', code => { if(worker===current){worker=undefined;fail(new Error(`Workspace audit worker exited (${code})`))} })
    return current
  }
  function request<T>(payload: { workspace: string; team?: TeamState; paths?: readonly string[]; previewPath?: string; cache?: boolean }): Promise<T> {
    if (closed) return Promise.reject(new Error('Workspace auditor disposed'))
    const key = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
    const existing = shared.get(key)
    if (existing) return existing as Promise<T>
    if (pending.size >= 32) return Promise.reject(new Error('Workspace audit busy; retry later'))
    const id = ++sequence
    const result = new Promise<unknown>((resolve,reject) => {
      const active = getWorker(); active.ref()
      const timer = setTimeout(() => {
        if (worker !== active) return
        worker = undefined; fail(new Error('Workspace audit timed out')); void active.terminate()
      }, options.timeoutMs ?? WORKSPACE_AUDIT_TIMEOUT_MS)
      pending.set(id,{resolve,reject,timer})
      try { active.postMessage({id,...payload}) }
      catch(error){clearTimeout(timer);pending.delete(id);if(!pending.size)active.unref();reject(error)}
    }).finally(() => { if(shared.get(key)===result)shared.delete(key) })
    shared.set(key,result)
    return result as Promise<T>
  }
  return {
    audit(workspace: string, team: TeamState): Promise<DeliveryAudit> {
      if (closed) return Promise.reject(new Error('Workspace auditor disposed'))
      if (!deliveryArtifactPaths(team).length && !deliveryScopePatterns(team).length) return Promise.resolve({artifacts:[],expandedScope:[]})
      return request({workspace,team})
    },
    readScope(workspace: string, paths: readonly string[], cache = false): Promise<ArtifactScopeRead> {
      return request({workspace,paths,cache})
    },
    preview(workspace: string, path: string): Promise<OutcomePreview> {
      return request({workspace,previewPath:path})
    },
    async dispose() { closed=true;fail(new Error('Workspace auditor disposed'));const active=worker;worker=undefined;if(active)await active.terminate() },
  }
}
