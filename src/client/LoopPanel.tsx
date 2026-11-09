import { useEffect, useRef, useState } from 'react'
import type { TeamState, TeamTask, ArtifactDigest } from '../types.ts'
import type { LoopHistoryRecord } from '../workflow-loop-types.ts'
import { workflowRequest } from './workflow-request.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import css from './LoopPanel.module.css'

export function LoopPanel({ team, task, sessionId, base, archived, busy, perform }: {
  team: TeamState; task: TeamTask; sessionId: string; base: string; archived: boolean; busy: boolean
  perform: (action: string, fields: Record<string, unknown>) => Promise<unknown>
}) {
  const l = useWorkflowText(), tr = (zh: string, en: string) => l.language === 'en' ? en : zh
  const loop = team.workflow?.loops?.find(item => item.gateId === task.id || item.bodyIds.includes(task.id))
  const [entry, setEntry] = useState(''), [mode, setMode] = useState<'human' | 'ai'>('human'), [reviewer, setReviewer] = useState('')
  const [rounds, setRounds] = useState(3), [timeout, setTimeoutMinutes] = useState(30), [extra, setExtra] = useState(1)
  const [note, setNote] = useState(''), [targets, setTargets] = useState<string[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<{ artifactEvidence: string; fingerprint: string; runId: string; round: number; tasks: TeamTask[]; files?: ArtifactDigest[] }>()
  const [history, setHistory] = useState<{ records: LoopHistoryRecord[]; next?: string }>(), [comparison, setComparison] = useState<LoopHistoryRecord>()
  const historyScope = `${team.id}:${loop?.runId}:${task.id}`
  const historyScopeRef = useRef(historyScope); historyScopeRef.current = historyScope
  const scope = `${historyScope}:${loop?.round}`
  const scopeRef = useRef(scope); scopeRef.current = scope
  useEffect(() => { setMaterials(undefined); setNote(''); setTargets([]); setError(''); setLoading(false) }, [scope])
  useEffect(() => { setHistory(undefined); setComparison(undefined) }, [historyScope])
  if (!loop && (task.checkpoint?.kind !== 'gate' || task.status !== 'pending' || (task.attempt ?? 0) > 0 || archived)) return null
  const ancestors = new Set<string>()
  const visit = (id: string) => { if (ancestors.has(id)) return; ancestors.add(id); team.tasks.find(t => t.id === id)?.dependencies.forEach(visit) }
  task.dependencies.forEach(visit)
  const exhausted = !!loop && loop.lastDecision === 'revise' && loop.round >= loop.maxRounds
  const capped = exhausted && loop!.maxRounds >= 20
  const request = async (action: string, fields: Record<string, unknown> = {}) => {
    const result = await workflowRequest({ action, sessionId, teamId: team.id, loopId: loop?.id, archived, ...fields })
    if (action === 'loop_history' ? historyScopeRef.current !== historyScope : scopeRef.current !== scope) throw new Error(tr('轮次已变化，请重新读取', 'Round changed; reload the materials'))
    return result
  }
  const guarded = async (fn: () => Promise<unknown>) => {
    setLoading(true); setError('')
    try { await fn() } catch (err) { if (scopeRef.current === scope) setError(err instanceof Error ? err.message : String(err)) } finally { if (scopeRef.current === scope) setLoading(false) }
  }
  const blocked = busy || loading
  const statuses = { ready: tr('等待启动', 'Ready'), running: tr('执行中', 'Running'), reviewing: tr('审核中', 'Reviewing'), paused: tr('已暂停', 'Paused'), passed: tr('已通过', 'Passed'), cancelled: tr('已结束', 'Cancelled') }
  return <section className={css.panel} aria-label={tr('门控节点', 'Gate node')}>
    <h3>{tr('门控节点', 'Gate node')}</h3>
    {error && <p role="alert">{error}</p>}
    {!loop ? <>
      <p>{tr('必须连接返回线形成环路才能运行。退回时重跑原节点，保留历轮结果；不会新建返工路径。', 'A return edge forming a loop is required. Revisions rerun existing nodes and preserve round history without creating a new path.')}</p>
      <label>{tr('返回连线目标（必选）', 'Return target (required)')}<select aria-label={tr('返回连线目标（必选）', 'Return target (required)')} value={entry} onChange={e => setEntry(e.target.value)}><option value="">{tr('选择上游任务', 'Select an upstream task')}</option>{team.tasks.filter(t => !t.checkpoint && ancestors.has(t.id)).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}</select></label>
      <label>{tr('审核方式', 'Review mode')}<select aria-label={tr('审核方式', 'Review mode')} value={mode} onChange={e => setMode(e.target.value as 'human' | 'ai')}><option value="human">{tr('人工审核', 'Human review')}</option><option value="ai">{tr('AI 自动审核', 'Automatic AI review')}</option></select></label>
      {mode === 'ai' && <label>{tr('独立审核成员', 'Independent reviewer')}<select aria-label={tr('独立审核成员', 'Independent reviewer')} value={reviewer} onChange={e => setReviewer(e.target.value)}><option value="">{tr('选择审核成员', 'Choose reviewer')}</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name}>{m.name}</option>)}</select></label>}
      <label>{tr('轮次上限（包含首次）', 'Round limit (including first)')}<input aria-label={tr('轮次上限（包含首次）', 'Round limit (including first)')} type="number" min={1} max={20} value={rounds} onChange={e => setRounds(Number(e.target.value))} /></label>
      <label>{tr('每轮超时（分钟）', 'Round timeout (minutes)')}<input aria-label={tr('每轮超时（分钟）', 'Round timeout (minutes)')} type="number" min={1} max={1440} value={timeout} onChange={e => setTimeoutMinutes(Number(e.target.value))} /></label>
      <button disabled={blocked || !entry || mode === 'ai' && !reviewer} onClick={() => void guarded(() => perform('loop_configure', { base, config: { gateId: task.id, entryId: entry, mode, reviewer, maxRounds: rounds, timeoutMinutes: timeout } }))}>{tr('连接返回线并创建环路', 'Connect return edge and create loop')}</button>
    </> : <>
      <strong>{statuses[loop.status]} · {tr('第', 'Round')} {loop.round}/{loop.maxRounds} · {loop.mode === 'ai' ? `AI · ${loop.reviewer}` : tr('人工审核', 'Human review')}</strong>
      <p>{loop.reason || tr('通过门控后才会继续执行环外任务。', 'Downstream tasks wait until this gate passes.')}</p>
      {loop.feedback && <details><summary>{tr('最近审核意见', 'Latest feedback')}</summary><pre>{loop.feedback}</pre></details>}
      {!archived && <div className={css.controls}>
        {['ready', 'paused'].includes(loop.status) && <>
          {exhausted && !capped && <label>{tr('明确追加轮数', 'Add rounds explicitly')}<input aria-label={tr('明确追加轮数', 'Add rounds explicitly')} type="number" min={1} max={20 - loop.maxRounds} value={extra} onChange={e => setExtra(Number(e.target.value))} /></label>}
          {capped && <p>{tr('已达单次运行 20 轮上限，请结束后建立新流程。', 'This run reached its 20-round maximum. End it and create a new workflow.')}</p>}
          <button disabled={blocked || capped || team.phase === 'staged' || !!team.halted} onClick={() => void guarded(() => perform('loop_start', { base, loopId: loop.id, additionalRounds: loop.lastDecision === 'revise' && loop.round >= loop.maxRounds ? extra : 0 }))}>{loop.status === 'ready' ? tr('启动循环', 'Start loop') : tr('继续循环', 'Resume loop')}</button>
        </>}
        {!['passed', 'cancelled', 'ready'].includes(loop.status) && <button disabled={blocked} onClick={() => void guarded(() => perform('loop_pause', { base, loopId: loop.id }))}>{tr('暂停并停止执行', 'Pause and stop execution')}</button>}
        {!['passed', 'cancelled'].includes(loop.status) && <button disabled={blocked} onClick={() => void guarded(() => perform('loop_cancel', { base, loopId: loop.id }))}>{tr('结束循环', 'End loop')}</button>}
      </div>}
      {!archived && loop.status === 'reviewing' && loop.mode === 'human' && <>
        <button disabled={blocked} onClick={() => void guarded(async () => setMaterials(await request('loop_materials') as typeof materials))}>{tr('读取本轮审核材料', 'Read current review materials')}</button>
        {materials && <>
          {materials.files?.map(file => <details key={file.path}><summary>{file.path} · {file.skipped ? tr('按策略跳过内容审计，请在本机检查', 'Content audit skipped by policy; check this file locally') : !file.present ? tr('文件不存在', 'File does not exist') : tr('已读取摘要', 'Digest recorded')}</summary>{file.size !== undefined && <p>{file.size.toLocaleString()} bytes</p>}{file.reason && <p>{file.reason}</p>}{file.sha256 && <code>{file.sha256}</code>}</details>)}
          {materials.tasks.map(t => <details key={t.id}><summary>{t.subject} · {t.status}</summary><pre>{t.output || tr('没有完成结果', 'No completed result')}</pre><pre>{JSON.stringify({ acceptance: t.acceptanceResults, verification: t.commandsRun }, null, 2)}</pre></details>)}
          <label>{tr('审核意见、修改要求与复验条件', 'Findings, required changes and revalidation')}<textarea rows={5} maxLength={16000} value={note} onChange={e => setNote(e.target.value)} /></label>
          <fieldset><legend>{tr('需要改进的任务（其下游也会重跑）', 'Tasks to revise (their descendants rerun too)')}</legend>{loop.bodyIds.map(id => <label key={id} className={css.check}><input type="checkbox" checked={targets.includes(id)} onChange={e => setTargets(value => e.target.checked ? [...value, id] : value.filter(v => v !== id))} />{team.tasks.find(t => t.id === id)?.subject}</label>)}</fieldset>
          <div className={css.controls}>{(['pass', 'revise', 'blocked'] as const).map(decision => <button key={decision} disabled={blocked || !note.trim() || decision === 'revise' && !targets.length} onClick={() => void guarded(async () => {
            const result = await perform('loop_decide', { loopId: loop.id, decisionId: crypto.randomUUID(), runId: materials.runId, round: materials.round, fingerprint: materials.fingerprint, artifactEvidence: materials.artifactEvidence, decision, note, taskIds: targets })
            if (result) { setMaterials(undefined); setNote(''); setTargets([]) }
          })}>{decision === 'pass' ? tr('通过并继续', 'Pass and continue') : decision === 'revise' ? tr('按意见改进', 'Revise with feedback') : tr('无法继续，暂停', 'Blocked, pause')}</button>)}</div>
        </>}
      </>}
      <button disabled={blocked} onClick={() => void guarded(async () => setHistory(await request('loop_history') as typeof history))}>{tr('查看多轮历史', 'View round history')} ({loop.historyCount})</button>
      {history && <div className={css.history}>
        <p>{tr('历史只读，按页加载。文件摘要不等于历史文件副本。', 'Read-only, paginated history. File digests are not historical file copies.')}</p>
        {history.records.map(record => <details key={record.id}><summary>{tr('第', 'Round')} {record.round} · {{ execution: tr('执行记录', 'Execution'), decision: tr('审核决定', 'Decision'), control: tr('运行控制', 'Control') }[record.kind]} · {new Date(record.at).toLocaleString()} · {record.decision ? { pass: tr('通过','Pass'), revise: tr('改进','Revise'), blocked: tr('暂停','Blocked') }[record.decision] : ''}</summary><pre>{record.summary}</pre>{record.members?.map(member=><small key={member.name}>{member.name} · {member.activeProvider??member.provider} / {member.activeModel??member.model} · {member.reasoningEffort}</small>)}
          {record.tasks.map(t => <details key={t.id}><summary>{t.subject} · {tr('执行', 'Attempt')} {t.attempt ?? 0} · {t.status}{record.executionRounds?.[t.id] && record.executionRounds[t.id]! < record.round ? ` · ${tr('沿用第', 'Reused from round')} ${record.executionRounds[t.id]}` : ''}</summary><pre>{t.output || '—'}</pre><pre>{JSON.stringify({ requirements: t.description, acceptance: t.acceptanceResults, commands: t.commandsRun, findings: t.findings, feedback: t.workflowRerunContext?.instructions }, null, 2)}</pre></details>)}
          <button onClick={() => setComparison(record)}>{tr('固定此记录用于比较', 'Pin this record to compare')}</button>
        </details>)}
        {comparison && <details open><summary>{tr('比较基准', 'Comparison reference')} · {comparison.round}</summary><pre>{comparison.summary}</pre>{comparison.tasks.map(t => <pre key={t.id}>{t.subject}{'\n'}{t.output}</pre>)}<button onClick={() => setComparison(undefined)}>{tr('取消固定', 'Unpin')}</button></details>}
        {history.next && <button disabled={blocked} onClick={() => void guarded(async () => setHistory(await request('loop_history', { cursor: history.next }) as typeof history))}>{tr('更早记录', 'Older records')}</button>}
      </div>}
    </>}
  </section>
}
