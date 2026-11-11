import { createHash } from 'node:crypto'
import type { TeamTask } from './types.ts'

export function excerpt(text: string | undefined, limit = 4096): string | undefined {
  if (!text || text.length <= limit) return text
  const half = Math.floor(limit / 2)
  return text.slice(0, half) + ' …[节选]… ' + text.slice(-half)
}

// Bind the full submitted results, including portions omitted from the display.
export function resultDigest(tasks: TeamTask[]): string {
  const hash = createHash('sha256')
  for (const t of tasks) hash.update(JSON.stringify([t.id,t.subject,t.status,t.attemptId,t.output,t.acceptanceResults,t.commandsRun,t.supplementalEvidence,t.verdict,t.findings]))
  return hash.digest('hex')
}

function sample<T extends { status: string }>(reports: T[]) {
  return [...reports.filter(r => r.status === 'failed'), ...reports.filter(r => r.status !== 'failed')].slice(0, 12)
}

export function reviewResult(t: TeamTask, gate?: TeamTask) {
  const extra = t.supplementalEvidence ?? []
  const checks = [...t.acceptanceResults ?? [], ...extra.flatMap(e => e.acceptanceResults ?? [])]
  const required = new Set(gate?.acceptance ?? [])
  const relevant = (criterion: string) => required.has(criterion) || !!(criterion && gate?.description?.includes(criterion))
  const orderedChecks = [...sample(checks.filter(r => relevant(r.criterion))), ...sample(checks.filter(r => !relevant(r.criterion)))].slice(0,12)
  const commands = [...t.commandsRun ?? [], ...extra.flatMap(e => e.commandsRun ?? [])]
  const notes = extra.map(e => e.note).filter(Boolean).join('\n')
  const findings = t.findings?.slice(0,8).map(f => excerpt(f.problem,256)).join('\n')
  const output = [excerpt(t.output), excerpt(notes, 1500), findings, ...(checks.length > 12 || commands.length > 12 ? ['检查和命令记录已节选，优先展示验收要求中的条目及失败记录。'] : [])].filter(Boolean).join('\n')
  return { id:t.id, subject:excerpt(t.subject, 256), status:t.status, attemptId:t.attemptId, output,
    acceptanceResults:orderedChecks.map(r => ({status:r.status,criterion:excerpt(r.criterion,256),evidence:excerpt(r.evidence,512)})),
    commandsRun:sample(commands).map(r => ({status:r.status,exitCode:r.exitCode,command:excerpt(r.command,256),evidence:excerpt(r.evidence,512)})) }
}
