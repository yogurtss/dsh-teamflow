/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { TeamState, TeamTask } from '../types.ts'
import type { WorkflowOperation } from '../workflow-types.ts'
import css from './WorkflowWorkbench.module.css'
import { WorkflowContext } from './WorkflowContext.tsx'
import { connectionIssue, connectionTarget } from './workflow-connections.ts'
import { LEAD_ART, REVIEW_ART, memberArtUrl } from './artwork.ts'
import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { AgentTeamsTranslate } from './locales.ts'
import { StagedModelPicker } from './StagingPlanEditor.tsx'
import { EmbeddedDiscussion } from './EmbeddedDiscussion.tsx'
import { ProposalReview, type ProposalReviewDraft } from './ProposalReview.tsx'
import { TaskRerunPicker } from './TaskRerunPicker.tsx'
import { rerunnableTasks } from '../task-rerun.ts'
import { draftSource, editorKey, editorTarget, finishWorkbenchSave, initialEditorDraft, initialWorkbenchView, selectWorkbench, targetDiscussion, type EditorTarget, type WorkbenchTarget, type WorkbenchView } from './workbench-selection.ts'
import { publishWorkflowActivity, type ActivityTeam } from './activity-monitor.ts'

interface Response { team: TeamState; base: string; ready: string[]; busy: string[]; openedSessionId?: string; currentDiscussion?: string; activity?:ActivityTeam }
async function request(payload: Record<string, unknown>): Promise<Response | undefined> {
  const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const result = await response.json() as Response & { error?: string }
  if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`)
  if (!result.team) return
  return result
}
const taskStatus = (task: TeamTask, ready: string[]): string => task.workflowRerunRequired ? '下游挂起 · 待你确认' : task.workflowPaused ? '已暂停 · 可编辑'
  : task.checkpoint?.decision === 'reject' ? '已拒绝 · 等待返工'
  : ready.includes(task.id) ? '等待人工验收'
  : ({ pending: '等待执行', claimed: '已领取', in_progress: '执行中', completed: '已完成', failed: '失败', cancelled: '已取消' })[task.status]

function ReviewMaterials({ text }: { text: string }) {
  try {
    const material = JSON.parse(text) as { check: { round: number }; results: Pick<TeamTask, 'id' | 'subject' | 'output' | 'commandsRun' | 'acceptanceResults'>[]; files?: { artifacts: { path: string; present: boolean; unreadable?: boolean }[] }; limitation?: string }
    if (!Array.isArray(material.results) || !material.check) return <pre>{text}</pre>
    return <div className={css.materials}><small>第 {material.check.round} 轮验收</small>
      {material.results.length === 0 && <p>此检查点没有上游执行结果，请根据验收要求确认是否继续。</p>}
      {material.results.map(result => <section key={result.id}><strong>{result.subject}</strong><p>{result.output || '尚未提交结果说明'}</p>
        {result.commandsRun?.map((command, i) => <p key={i}>{command.status === 'passed' ? '通过' : '未通过'} · {command.command}{command.evidence ? `\n${command.evidence}` : ''}</p>)}
        {result.acceptanceResults?.map((item, i) => <p key={i}>{item.status === 'passed' ? '通过' : '未通过'} · {item.criterion}{item.evidence ? `\n${item.evidence}` : ''}</p>)}
      </section>)}
      {!!material.files?.artifacts.length && <section><strong>相关文件</strong>{material.files.artifacts.map(file => <p key={file.path}>{file.path}{file.unreadable ? ' · 无法读取' : !file.present ? ' · 文件不存在' : ''}</p>)}</section>}
      <p className={css.hint}>{material.limitation}</p><details><summary>原始证据记录</summary><pre>{text}</pre></details>
    </div>
  } catch { return <pre>{text}</pre> }
}

export function WorkflowWorkbench({ sessionId, teamId, waitingCount = 0, openExecution, openConversation, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t }: {
  modelDirectory?: ModelDirectory
  t?: AgentTeamsTranslate
  reviewEntryOnly?: boolean
  embeddedContext?: boolean
  onNativeContext?: (value: boolean) => void
  openContext?: () => void
  nativeOnly?: boolean
  openConversation?: (id: string) => void | Promise<void>
  sessionId: string; teamId?: string; waitingCount?: number; openExecution?: (memberId: string, parentId?: string) => void | Promise<void>
}) {
  const [opened, setOpened] = useState(false)
  const [data, setData] = useState<Response>()
  const [activeId, setActiveId] = useState(teamId)
  const [view, setView] = useState(initialWorkbenchView)
  const viewRef = useRef(view)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ProposalReviewDraft>>({})
  const [working, setWorking] = useState(false)
  const [note, setNote] = useState('')
  const [embeddedDiscussion, setEmbeddedDiscussion] = useState<string>()
  const [pane, setPane] = useState<'members' | 'flow' | 'discussion'>('flow')
  const [name, setName] = useState('新团队')
  const [goal, setGoal] = useState('')

  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [link, setLink] = useState<{ from: string; x: number; y: number; to?: string; issue?: string }>()
  const suppressNodeClick = useRef(false)
  const cancelLink = useRef<(() => void) | undefined>(undefined)
  const canvas = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLElement>(null)
  const mounted = useRef(true)
  const generation = useRef(0)
  const initializedDiscussion = useRef(false)
  const team = data?.team
  const selection = view.target
  const discussion = targetDiscussion(selection)
  const selectedTask = selection.type === 'task' || selection.type === 'check' ? selection.id : undefined
  const selectedEdge = selection.type === 'edge' ? selection : undefined
  const editor = editorTarget(team, selection)
  const draftId = editor ? editorKey(team?.id ?? '', editor) : undefined
  const draftEntry = draftId ? view.drafts[draftId] : undefined
  const draft = draftEntry?.values ?? (editor ? initialEditorDraft(team, editor).values : {})
  const draftStale = !!editor && !!draftEntry && draftEntry.source !== draftSource(team, editor)
  const highlightedTask = selectedTask ?? (discussion.startsWith('check:') ? discussion.slice(6) : undefined)
  const relatedMember = selection.type === 'member' ? selection.id : selectedTask ? team?.tasks.find(task => task.id === selectedTask)?.assignee : discussion.startsWith('member:') ? discussion.slice(7) : undefined
  const conversation = team?.workflow?.discussions[`discussion:${discussion}`]
  const proposal = conversation?.proposal?.status === 'pending' ? conversation.proposal : undefined
  const reviewTask = discussion.startsWith('check:') ? team?.tasks.find(t => t.id === discussion.slice(6)) : undefined
  const activeTask = team?.tasks.find(t => t.id === selectedTask)
  const member = discussion.startsWith('member:') ? team?.members.find(m => m.name === discussion.slice(7)) : undefined
  const defaultPositions = useMemo(() => {
    const tasks = team?.tasks ?? [], depths = new Map<string, number>(), rows = new Map<number, number>()
    function depth(id: string, seen = new Set<string>()): number {
      if (depths.has(id)) return depths.get(id)!
      if (seen.has(id)) return 0
      const next = new Set(seen).add(id), task = tasks.find(t => t.id === id)
      const value = task?.dependencies.length ? 1 + Math.max(...task.dependencies.map(dep => depth(dep, next))) : 0
      depths.set(id, value); return value
    }
    return Object.fromEntries(tasks.map(task => {
      const column = depth(task.id), row = rows.get(column) ?? 0; rows.set(column, row + 1)
      return [task.id, { x: 32 + column * 270, y: 32 + row * 160 }]
    }))
  }, [team?.tasks])
  const taskEditing = !!editor && editor.type !== 'member'
  useEffect(() => { onNativeContext?.(!!data?.currentDiscussion) }, [data?.currentDiscussion, onNativeContext])
  function updateView(update: (current: WorkbenchView) => WorkbenchView): void { const next = update(viewRef.current); viewRef.current = next; setView(next) }
  function choose(target: WorkbenchTarget, overrides?: Record<string,string>): void {
    updateView(current => selectWorkbench(current, target, team, overrides)); setError(''); setFeedback('')
    setPane(target.type === 'member' ? 'members' : target.type === 'task' || target.type === 'check' || target.type === 'edge' ? 'flow' : 'discussion')
  }
  const selectDiscussion = (key: string) => choose({ type:'discussion', key })
  function closeWorkbench(): void { updateView(current=>({...current,revision:current.revision+1})); setOpened(false) }
  function setDraft(update: Record<string,string> | ((previous: Record<string,string>) => Record<string,string>)): void {
    if (!editor || !draftId) return
    updateView(current => { const entry = current.drafts[draftId] ?? initialEditorDraft(team, editor); return { ...current, drafts:{...current.drafts,[draftId]:{...entry,values:typeof update === 'function' ? update(entry.values) : update}} } })
  }
  function cancelEdit(): void {
    if (draftId) updateView(current => { const drafts={...current.drafts}; delete drafts[draftId]; return {...current,drafts} })
    selectDiscussion(editor?.type === 'member' && editor.id ? `member:${editor.id}` : 'graph')
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!opened) return
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLElement>('button, input')?.focus()
    return () => previous?.focus()
  }, [opened])
  useEffect(() => {
    if (editor && !editor.id) dialog.current?.querySelector<HTMLElement>('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus()
  }, [editor])
  useEffect(() => { if (teamId && teamId !== activeId) { setActiveId(teamId); setData(undefined); updateView(current => ({...initialWorkbenchView(),revision:current.revision+1})); setPositions({}); initializedDiscussion.current = false; generation.current++ } }, [sessionId, teamId])
  const refresh = async (): Promise<void> => {
    const token = generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, action: 'state' })
      if (!result) return
      if (mounted.current && token === generation.current) {
        setData(result); setActiveId(result.team.id)
        if (!initializedDiscussion.current && result.currentDiscussion) { initializedDiscussion.current = true; if (viewRef.current.revision === 0) selectDiscussion(result.currentDiscussion) }
      }
    } catch (err) { if (mounted.current && token === generation.current && activeId) setError(String(err)) }
  }
  useEffect(() => {
    if (working || (!activeId && data)) return
    void refresh()
    // A restored native conversation can mount before the host attaches its
    // Agent. Keep retrying discovery so that its persisted team appears without
    // requiring another navigation or accidentally offering to create a team.
    const timer = setInterval(() => { if (!working) void refresh() }, 2500)
    return () => clearInterval(timer)
  }, [activeId, working])
  async function perform(action: string, fields: Record<string, unknown> = {}): Promise<Response | undefined> {
    setWorking(true)
    setError(''); setFeedback(''); const token = ++generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, discussion, action, ...fields })
      if (!result) return
      if(result.activity) publishWorkflowActivity(result.activity)
      if (mounted.current && token === generation.current) { setData(result); setActiveId(result.team.id) }
      return result
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : String(err)); return undefined }
    finally { if (mounted.current) { setWorking(false) } }
  }
  async function openDiscussion(key = discussion, targetId = activeId, fresh = false, message?: string): Promise<void> {
    selectDiscussion(key)
    const revision = viewRef.current.revision
    if (!openConversation) { setError('请在 DSH 中打开原生对话；开发预览不连接模型。'); return }
    const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh, message })
    if (result?.openedSessionId && viewRef.current.revision === revision) {
      if (result.openedSessionId === team?.captainSessionId || !result.openedSessionId.startsWith('session-at-discussion-')) { setError('宿主未返回独立讨论会话，已取消跳转'); return }
      try { await openConversation(result.openedSessionId); closeWorkbench(); openContext?.() }
      catch (error) { setError(String(error)) }
    }
  }
  async function createFlow(): Promise<void> {
    const created = await perform('create', { name, description: goal })
    if (created) await startEmbedded('graph', created.team.id)
  }
  async function saveEdit(operations: WorkflowOperation[], title: string, finishEditing = false): Promise<Response | undefined> {
    if (finishEditing && draftStale) { setError('当前对象已变化。草稿已保留，请先核对最新资料，或点击「重新载入」后编辑。'); return }
    const revision=viewRef.current.revision, submitted=draftId&&editor?(viewRef.current.drafts[draftId]??initialEditorDraft(team,editor)):undefined
    const result=await perform('edit', { operations, title, base: data?.base, positions: Object.fromEntries(team?.tasks.map(task => [task.id, pos(task.id)]) ?? []) })
    if (result && finishEditing) {
      let nextTarget: WorkbenchTarget | undefined
      if(editor?.id && (editor.type==='member' ? !result.team.members.some(m=>m.name===editor.id && m.status!=='removed') : !result.team.tasks.some(task=>task.id===editor.id))) nextTarget={type:'discussion',key:'graph'}
      if(editor && !editor.id) {
        if(editor.type==='member') { const added=operations.find(op=>op.action==='add_member'); if(added?.action==='add_member') nextTarget={type:'member',id:added.name.trim()} }
        else { const added=result.team.tasks.find(task=>!team?.tasks.some(old=>old.id===task.id)); if(added) nextTarget={type:added.checkpoint?'check':'task',id:added.id} }
      }
      updateView(current=>finishWorkbenchSave(current,draftId,submitted,revision,result.team,nextTarget,editor))
      if(viewRef.current.revision===revision) setFeedback(draftId && viewRef.current.drafts[draftId] ? '已保存本次提交；后续修改仍为草稿。' : '已保存。')
    }
    return result
  }
  async function startEmbedded(key: string, targetId = activeId, fresh = false): Promise<void> {
    selectDiscussion(key)
    const revision=viewRef.current.revision
    const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh })
    if (revision!==viewRef.current.revision) return
    if (result?.openedSessionId && result.openedSessionId.startsWith('session-at-discussion-') && result.openedSessionId !== team?.captainSessionId) setEmbeddedDiscussion(key)
    else if (result) setError('宿主未返回独立讨论会话')
  }
  function prepareDiscussion(name: string): void { void startEmbedded(`member:${name}`, activeId) }
  async function deleteEdge(): Promise<void> {
    const target = team?.tasks.find(task => task.id === selectedEdge?.to)
    if (!target || !selectedEdge || working) return
    const revision=viewRef.current.revision
    if(await saveEdit([{ action: 'update_task', id: target.id, dependencies: target.dependencies.filter(id => id !== selectedEdge.from) }], '删除任务交接') && revision===viewRef.current.revision) selectDiscussion('graph')
  }
  async function deleteNode(id: string): Promise<void> {
    if (!team || working) return
    const updates: WorkflowOperation[] = team.tasks.filter(task => task.dependencies.includes(id)).map(task => ({ action: 'update_task', id: task.id, dependencies: task.dependencies.filter(dep => dep !== id) }))
    updates.push({ action: 'remove_task', id })
    const revision=viewRef.current.revision
    if (await perform('edit', { operations: updates, title: '删除节点及其连接', base: data?.base, positions: Object.fromEntries(team.tasks.map(task => [task.id, pos(task.id)])) }) && revision===viewRef.current.revision) selectDiscussion('graph')
  }
  function beginNodeDrag(event: ReactPointerEvent<HTMLElement>, task: TeamTask): void {
    suppressNodeClick.current=false
    if (event.button !== 0 || working || (event.target as HTMLElement).closest('[data-connection-handle]')) return
    const target = event.currentTarget, start = point(event), original = pos(task.id)
    let last = original, moved = false
    target.setPointerCapture(event.pointerId)
    const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId) }
    target.onpointermove = move => {
      const at = point(move)
      if (!moved && Math.hypot(at.x - start.x, at.y - start.y) < 4 / zoom) return
      if(!moved) edit(task.checkpoint?'check':'task',task.id)
      moved = true; suppressNodeClick.current = true
      last = { x: Math.min(10000, Math.max(0, original.x + at.x - start.x)), y: Math.min(10000, Math.max(0, original.y + at.y - start.y)) }
      setPositions(prev => ({ ...prev, [task.id]: last }))
    }
    target.onpointerup = () => { cleanup(); if (moved) void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next })) }
    target.onpointercancel = () => { cleanup(); suppressNodeClick.current = false; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next }) }
  }
  function edit(type: EditorTarget['type'], id?: string, overrides?: Record<string,string>): void { choose({type,id},overrides) }
  const field = (key: string, label: string, multiline = false) => <label>{label}{multiline
    ? <textarea required={key === 'summary' && !editor?.id} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
    : <input required={key === 'name' || key === 'subject' || (key === 'summary' && !editor?.id)} value={draft[key] ?? ''} disabled={key === 'name' && !!editor?.id} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}</label>
  function pos(id: string) {
    return positions[id] ?? team?.workflow?.positions[`task:${id}`] ?? defaultPositions[id] ?? { x: 32, y: 32 }
  }
  function point(event: { clientX: number; clientY: number }) {
    const bounds = canvas.current!.getBoundingClientRect()
    return { x: (event.clientX - bounds.left + canvas.current!.scrollLeft) / zoom, y: (event.clientY - bounds.top + canvas.current!.scrollTop) / zoom }
  }
  const draftPosition = editor?.id ? pos(editor.id) : {
    x: 32,
    y: Math.max(-128, ...team?.tasks.map(t => pos(t.id).y) ?? []) + 160,
  }
  const graphWidth = Math.max(580, ...team?.tasks.map(t => pos(t.id).x + 265) ?? [], taskEditing ? draftPosition.x + 265 : 0)
  const graphHeight = Math.max(260, ...team?.tasks.map(t => pos(t.id).y + 170) ?? [], taskEditing ? draftPosition.y + 170 : 0)
  function fitCanvas(): void {
    if (!canvas.current) return
    setZoom(Math.max(.45, Math.min(1, (canvas.current.clientWidth - 20) / graphWidth)))
  }
  async function openReview(id: string): Promise<void> {
    selectDiscussion(`check:${id}`)
    const revision=viewRef.current.revision
    if (await perform('materials', { discussion: `check:${id}` }) && revision===viewRef.current.revision) {
      setOpened(true); await startEmbedded(`check:${id}`)
    }
  }
  function renderProposalReview() {
    if (!proposal || !team || !data) return null
    return <ProposalReview key={proposal.id} team={team} proposal={proposal} base={data.base} busy={working} draft={reviewDrafts[proposal.id]} onChange={draft => setReviewDrafts(prev => ({ ...prev, [proposal.id]: draft }))}
      onApply={operations => void perform('apply', { proposalId: proposal.id, operations }).then(result => { if (result) setFeedback('修改已应用，可继续讨论。') })}
      onDismiss={() => void perform('dismiss', { proposalId: proposal.id }).then(result => { if (result) setFeedback('修改已放弃，可以继续讨论。') })} />
  }
  const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => key.startsWith('discussion:') && item.proposal?.status === 'pending').map(([, item]) => item)
  const pendingCount = pendingProposals.length
  const pendingNotice = pendingCount > 0 && <div className={css.pendingNotice} role="status"><strong>有 {pendingCount} 项修改等待确认</strong>
    {pendingProposals.map(item => <button type="button" key={item.key} onClick={() => { selectDiscussion(item.key); setOpened(true) }}>查看并决定 · {item.proposal!.title}</button>)}
    {!!editor && <small>切换查看会保留当前草稿。</small>}
  </div>
  const reviewCount = data?.ready.length ?? waitingCount
  const reviewNotice = !!data?.ready.length && <div className={css.reviewNotice} role="status" aria-label="等待你验收">
    <strong><span className={css.reviewDot} aria-hidden />等待你验收</strong>
    {data.ready.map(id => <button type="button" key={id} disabled={working} onClick={() => void openReview(id)}>验收 · {team?.tasks.find(t => t.id === id)?.subject} ↗</button>)}
    {!reviewEntryOnly && <small>上游已完成 · 打开独立对话查看材料与 AI 总结</small>}
  </div>
  if (reviewEntryOnly && !opened) return <>{reviewNotice}{error && <span role="alert">{error}</span>}</>
  if (nativeOnly && !data?.currentDiscussion) return null
  return <>
    {data?.currentDiscussion && team && <div className={css.nativeBanner}><span>{data.currentDiscussion.startsWith('check:') ? '独立验收对话' : '独立配置对话'} · {team.name}</span><button className={css.entry} onClick={() => void openExecution?.(team.captainSessionId, team.captainSessionId)}>返回团队对话 ↗</button></div>}
    {!reviewEntryOnly && <button type="button" className={`${css.entry} ${nativeOnly ? css.compact : css.launcher}`} aria-haspopup="dialog" onClick={() => setOpened(true)}>
      <strong>团队与流程 <span aria-hidden>↗</span></strong>
      {!nativeOnly && <span>{team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队')}</span>}
      {pendingCount > 0 && <span>{pendingCount} 项修改待确认</span>}
      {reviewCount > 0 && <span>{reviewCount} 项等待人工验收</span>}
    </button>}
    {!nativeOnly && !reviewEntryOnly && team?.phase === 'staged' && <button type="button" className={`${css.entry} ${css.startEntry}`} disabled={working || !!editor || pendingCount > 0} title={editor ? '请在工作台保存或取消当前编辑' : pendingCount ? '请先处理待确认的修改' : undefined} onClick={() => void perform('start')}>确认并启动团队</button>}
    {!opened && !nativeOnly && !reviewEntryOnly && pendingNotice}
    {error && !opened && <div className={css.error} role="alert">{error}</div>}
    {!nativeOnly && reviewNotice}
    {nativeOnly && data?.currentDiscussion && openContext && <button className={`${css.entry} ${css.compact}`} onClick={openContext}>{proposal ? '查看待确认修改 ↗' : '团队与讨论资料 ↗'}</button>}
    {embeddedContext && team && <section className={css.contextPanel} aria-label="讨论资料"><header><strong>讨论资料</strong><span>当前已保存的信息</span></header><label>查看对象<select value={discussion} onChange={event => selectDiscussion(event.target.value)}><option value="graph">团队与流程</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name} value={`member:${m.name}`}>{m.name}</option>)}{team.tasks.filter(t => t.checkpoint).map(t => <option key={t.id} value={`check:${t.id}`}>验收 · {t.subject}</option>)}</select></label>
      {feedback && <p role="status">{feedback}</p>}
      {conversation?.materials && <details><summary>本轮验收证据</summary><ReviewMaterials text={conversation.materials} /></details>}
      {proposal && !opened && <section className={css.contextProposal} aria-label="待确认修改">{renderProposalReview()}<button onClick={() => { setPane('discussion'); setOpened(true) }}>在画布查看 ↗</button></section>}
      <WorkflowContext team={team} discussion={discussion} onSelect={selectDiscussion} openExecution={openExecution} />
    </section>}
    {opened && createPortal(<section ref={dialog} className={css.workbench} data-editing={!!editor || !!selectedEdge || !!activeTask} role="dialog" aria-modal="true" aria-label="TeamFlow 编排工作台" onKeyDown={event => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedEdge || selectedTask) && !(event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) { event.preventDefault(); if (selectedEdge) void deleteEdge(); else if (selectedTask) void deleteNode(selectedTask); return }
      if (event.key === 'Escape') { if (cancelLink.current) { cancelLink.current(); return }; if (editor) cancelEdit(); else closeWorkbench() }
      if (event.key === 'Tab') {
        const scope = dialog.current
        const items = [...scope?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary') ?? []].filter(el => el.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }}>
      <header className={css.header}><div className={css.title}><img src={LEAD_ART} alt="" /><div><strong>{team?.name ?? '创建团队'}</strong><span>{team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台'}</span></div></div>
        <div>{team?.phase === 'staged' && <button className={css.primary} disabled={working || !!editor || pendingCount > 0} title={editor ? '请先保存或取消当前编辑' : pendingCount ? '请先处理待确认的修改' : undefined} onClick={() => void perform('start')}>确认并启动</button>}
          <button onClick={closeWorkbench} aria-label="关闭编排工作台">关闭</button></div></header>
      {team && <nav className={css.paneTabs} aria-label="工作台视图">{(['members', 'flow', 'discussion'] as const).map(value => <button key={value} aria-pressed={pane === value} onClick={() => setPane(value)}>{value === 'members' ? `成员 ${team.members.filter(m => m.status !== 'removed').length}` : value === 'flow' ? '任务流程' : '修改与验收'}{value === 'discussion' && proposal && <i aria-label="有待确认的修改" />}</button>)}</nav>}
      {pendingNotice}
      {!!team?.tasks.some(task => task.workflowRerunRequired) && <details className={css.suspendedNotice} open><summary>上游已重跑 · {team.tasks.filter(task => task.workflowRerunRequired).length} 个下游节点等待你确认</summary><p>此前结果已失效。上游完成后，点击节点可修改要求，再确认执行或重新验收。</p>{team.tasks.filter(task => task.workflowRerunRequired).map(task => <button key={task.id} onClick={() => { edit(task.checkpoint ? 'check' : 'task', task.id) }}>{task.subject} · {task.dependencies.every(id => team.tasks.find(item => item.id === id)?.status === 'completed') ? '可确认' : '等待上游'}</button>)}</details>}
      {error && <div className={css.error} role="alert">{error}</div>}
      {!activeId ? <form className={css.create} onSubmit={e => { e.preventDefault(); void createFlow() }}>
        <h2>描述目标，一起规划团队</h2><label>团队名称<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>团队目标<textarea required value={goal} onChange={e => setGoal(e.target.value)} /></label><button className={css.primary} disabled={working}>在 DSH 中讨论方案 ↗</button>
      </form> : !team ? <p role="status">正在读取团队…</p> : <div className={css.columns} data-approving={!!proposal && !editor && !activeTask && !selectedEdge} data-pane={pane} data-editing={!!editor || !!selectedEdge || !!activeTask}>
        <aside className={css.roster}><h3>成员 <button aria-label="添加成员" onClick={() => edit('member')}>＋ 添加</button></h3>
          {team.members.filter(m => m.status !== 'removed').map(m => <article key={m.name} className={relatedMember === m.name ? css.selected : ''} onClick={event => { if (!(event.target as HTMLElement).closest('button')) { edit('member', m.name) } }}>
            <button className={css.member} aria-pressed={selection.type === 'member' && selection.id === m.name} onClick={() => { edit('member', m.name) }}><img src={memberArtUrl(m.name, m.role ?? '')} alt="" /><span><strong>{m.name}</strong><span>{m.summary || m.role || '尚未填写职责概述'}</span></span></button>
            <small>{m.model || '继承队长模型'}</small><div><button disabled={working} onClick={() => prepareDiscussion(m.name)}>讨论调整 ↗</button>
              {m.id && openExecution && <button onClick={() => { openExecution(m.id, team.captainSessionId); closeWorkbench() }}>执行对话 ↗</button>}
              {openExecution && m.previousSessionIds?.map((id, i) => <button key={id} onClick={() => { openExecution(id, team.captainSessionId); closeWorkbench() }}>历史执行 {i + 1} ↗</button>)}</div>
          </article>)}
          <p className={css.hint}>点击成员卡片直接编辑；讨论调整默认继续该成员的独立讨论，保留历史上下文。</p>
        </aside>
        <main className={css.graphArea}>
          <nav className={css.toolbar}><button onClick={() => edit('task')}>＋ 任务</button><button onClick={() => edit('check')}>＋ 人工检查</button><button aria-label="缩小画布" onClick={() => setZoom(value => Math.max(.45, value - .1))}>−</button><button aria-label="放大画布" onClick={() => setZoom(value => Math.min(1.5, value + .1))}>＋</button><button onClick={fitCanvas}>适应画布</button><span role={link || taskEditing ? 'status' : undefined}>{link ? link.issue ?? (link.to ? '已吸附到输入端 · 松开连接' : '靠近下一节点以连接 · Esc 取消') : '拖动节点右侧中心连接柄建立交接；点击节点编辑属性、点击连线查看；Delete 删除选中对象'}</span></nav>
          {reviewNotice}
          <div className={css.canvas} ref={canvas} onPointerDown={event => { if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains(css.plane!)) { selectDiscussion('graph') } }}>
            <div className={css.plane} style={{ width: graphWidth, height: graphHeight, zoom }}>
              <svg className={css.edges} aria-label="任务交接连线"><defs><marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor" /></marker></defs>
                {team.tasks.flatMap(t => t.dependencies.map(dep => { const a = pos(dep), b = pos(t.id); const path = `M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`; return <g key={`${dep}-${t.id}`} data-selected={selectedEdge?.from === dep && selectedEdge.to === t.id} className={css.edge}>
                  <path d={path} markerEnd="url(#workflow-arrow)" />
                  <path className={css.edgeHit} d={path} role="button" tabIndex={0} aria-label={`交接：${team.tasks.find(task => task.id === dep)?.subject ?? dep} → ${t.subject}`} aria-pressed={selectedEdge?.from === dep && selectedEdge.to === t.id} onClick={() => { choose({ type:'edge',from:dep,to:t.id }) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose({ type:'edge',from:dep,to:t.id }) } }} />
                </g> }))}
                {link && <path d={`M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}`} />}
              </svg>
              {team.tasks.map(task => { const p = pos(task.id); return <article key={task.id} data-member-match={selection.type === 'member' && !!selection.id && task.assignee === selection.id || undefined} data-connection={link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined} data-review-ready={!!task.checkpoint && data.ready.includes(task.id)} data-suspended={task.workflowRerunRequired || undefined} className={`${css.node} ${task.checkpoint ? css.checkpoint : ''} ${highlightedTask === task.id ? css.selected : ''}`} style={{ left: p.x, top: p.y }} onPointerDown={event => beginNodeDrag(event, task)} onClick={event => { if ((event.target as HTMLElement).closest('[data-connection-handle]')) return; if (suppressNodeClick.current) { suppressNodeClick.current = false; return }; edit(task.checkpoint ? 'check' : 'task', task.id) }}>
                <div className={css.drag}>⠿ {task.checkpoint ? '◇ 人工验收' : '执行任务'} · {task.id}</div>
                <button className={css.nodeBody} >
                  <strong>{task.subject}</strong><span className={css.taskOwner}><img src={task.checkpoint ? REVIEW_ART : memberArtUrl(task.assignee ?? '', team.members.find(m => m.name === task.assignee)?.role ?? '')} alt="" />{task.checkpoint ? '验收 Agent 与你' : task.assignee || '自动分配成员'}</span><small data-ready={data.ready.includes(task.id)}>{taskStatus(task, data.ready)}</small></button>
                <button className={`${css.port} ${css.input}`} data-connection-handle data-input-id={task.id} aria-label={`${task.subject} 输入端`} />
                <button className={`${css.port} ${css.output}`} data-connection-handle aria-label={`${task.subject} 输出端`} disabled={working || (taskEditing && !editor?.id)} title="从这里拖出连接线" onPointerDown={event => {
                  if (event.button !== 0) return
                  event.preventDefault()
                  const target = event.currentTarget
                  target.setPointerCapture(event.pointerId)
                  const update = (move: { clientX: number; clientY: number }) => {
                    const at = point(move), to = connectionTarget(team.tasks, pos, at, task.id)
                    const issue = to ? connectionIssue(team.tasks, task.id, to.id) : undefined
                    const end = to && !issue ? { x: pos(to.id).x, y: pos(to.id).y + 55 } : at
                    setLink({ from: task.id, ...end, to: to?.id, issue })
                    return { to, issue }
                  }
                  const cleanup = () => {
                    target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null
                    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
                    cancelLink.current = undefined; setLink(undefined)
                  }
                  cancelLink.current = cleanup
                  update(event)
                  target.onpointermove = move => { update(move) }
                  target.onpointerup = up => {
                    const { to, issue } = update(up); cleanup()
                    if (issue) setError(issue)
                    if (to && !issue) void saveEdit([{ action: 'update_task', id: to.id, dependencies: [...to.dependencies, task.id] }], `连接 ${task.subject} → ${to.subject}`)
                  }
                  target.onpointercancel = cleanup
                }} />
              </article> })}
              {taskEditing && !editor?.id && <article className={`${css.node} ${css.draftNode}`} style={{ left: draftPosition.x, top: draftPosition.y }}><div className={css.drag}>草稿 · 确认后加入流程</div><div className={css.nodeBody}><strong>{draft['subject'] || (editor?.type === 'check' ? '新人工检查' : '新任务')}</strong><span>{editor?.type === 'check' ? '你与独立验收 Agent' : draft['assignee'] || '待指定 Agent'}</span><small>尚未应用</small></div></article>}
              {!team.tasks.length && !editor && <p className={css.empty}>添加任务或人工检查，或让 AI 根据目标提出流程方案。</p>}
            </div>
          </div>
        </main>
          {selectedEdge && <aside className={css.editor} aria-label="交接详情"><strong>{team.tasks.find(task => task.id === selectedEdge.from)?.subject} → {team.tasks.find(task => task.id === selectedEdge.to)?.subject}</strong><p>上游完成后，下游才开始。按 Delete 删除此连线。</p><button disabled={working} onClick={() => void deleteEdge()}>删除连线</button></aside>}
          {activeTask && !editor && !selectedEdge && <aside className={css.editor} aria-label={activeTask.checkpoint ? '人工验收属性' : '任务属性'}><h3>{activeTask.checkpoint ? '人工验收属性' : '任务属性'}</h3><strong>{activeTask.subject}</strong><p>{activeTask.description || '暂无任务说明'}</p><p>{taskStatus(activeTask,data.ready)} · {activeTask.id}</p>{activeTask.checkpoint && <p>第 {activeTask.checkpoint.round} 轮 · {activeTask.checkpoint.note || '暂无验收意见'}</p>}<div>
            {!activeTask.checkpoint && activeTask.assignee && rerunnableTasks(team.tasks, activeTask.assignee).some(task => task.id === activeTask.id) && <button disabled={working} onClick={() => { edit('member', activeTask.assignee, {rerunTaskId:activeTask.id}) }}>修改负责人并重跑此任务</button>}
            {!activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && <button disabled={working} onClick={() => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id, base: data.base })}>{activeTask.workflowPaused ? '继续执行' : '停止任务以编辑'}</button>}
          </div></aside>}

        {!editor && !selectedEdge && !activeTask && <aside className={css.discussion}><header><img src={reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART} alt="" /><div><h3>{reviewTask ? `验收 · ${reviewTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改'}</h3>
          <small>{reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效'}</small></div></header>
          <div className={css.messages}>
            <p className={css.hint}>{reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : member ? '在这里与独立配置顾问讨论；队长对话保持独立。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。'}</p>
            {embeddedDiscussion === discussion && activeId ? <EmbeddedDiscussion key={`${activeId}:${discussion}:${conversation?.native?.sessionId}`} sessionId={sessionId} teamId={activeId} discussion={discussion} /> : <button className={css.primary} disabled={working} onClick={() => member ? prepareDiscussion(member.name) : void startEmbedded(discussion)}>在此处{conversation?.native ? '继续' : '开始'}讨论</button>}
            {embeddedDiscussion === discussion && conversation?.native && openConversation && <button disabled={working} onClick={() => void openDiscussion(discussion)}>打开完整 DSH 对话 ↗</button>}
            <details><summary>查看当前资料</summary><WorkflowContext team={team} discussion={discussion} onSelect={key => key.startsWith('member:') ? edit('member', key.slice(7)) : selectDiscussion(key)} openExecution={openExecution} /></details>
            {conversation?.materials && <details open><summary>本轮验收材料与证据</summary><ReviewMaterials text={conversation.materials} /></details>}
            {data.busy.includes(discussion) && <p role="status">原生对话正在整理方案…</p>}
          </div>
          {proposal && <section className={css.proposal}>{renderProposalReview()}</section>}
          {reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && <div className={css.decisions}>
            <button className={css.primary} disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok) setNote('') })}>通过验收</button>
            <button disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) { setNote(''); void startEmbedded(discussion) } })}>退回并讨论返工</button>
          </div>}
          {reviewTask?.checkpoint?.decision === 'reject' && <p className={css.notice}>已拒绝，下游保持等待。请讨论返工对象并确认新方案。</p>}
          {reviewTask && <div className={css.composer}><label>验收意见（随决定保存）<textarea aria-label="验收意见" value={note} onChange={e => setNote(e.target.value)} placeholder="记录通过或退回的原因…" /></label><button disabled={working || !data.ready.includes(reviewTask.id)} onClick={() => void perform('materials')}>刷新验收材料</button></div>}
          {!data.currentDiscussion && <details><summary>重新开始讨论</summary><p className={css.hint}>新建独立讨论会归档当前讨论，从当前资料重新开始。</p><button disabled={working || data.busy.includes(discussion)} onClick={() => void startEmbedded(discussion, activeId, true)}>新建独立讨论</button></details>}
        </aside>}

      {editor && <form key={`${editor.type}:${editor.id ?? 'new'}`} data-workflow-editor className={css.editor} onSubmit={event => {
        event.preventDefault()
        try {
          const route = draft['routeChanged'] ? { provider: draft['provider'], model: draft['model'], reasoningEffort: draft['reasoningEffort'] || 'default' } : {}
          const operations: WorkflowOperation[] = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'], ...route } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'], ...route }]
            : [editor.id ? { action: 'update_task', id: editor.id, subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'] } : { action: 'add_task', checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'], dependencies: [] }]
          const rerun = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-rerun') === 'true'
          if (rerun) {
            if (!editor.id || !draft['rerunTaskId'] || !team.tasks.some(task => task.id === draft['rerunTaskId'] && task.assignee === editor.id)) throw new Error('请选择该成员的已结束任务')
            operations.push({ action: 'rerun_task', id: draft['rerunTaskId'], instructions: draft['rerunInstructions'] })
          }
          const resumeId = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-resume') === 'true' ? editor.id : undefined
          const resumeCheck = editor.type === 'check', revision=viewRef.current.revision
          void saveEdit(operations, rerun ? '调整成员并单独重跑任务' : editor.type === 'member' ? '调整团队成员' : '调整任务', true).then(async saved => { if (saved && resumeId && await perform('resume_task', { taskId: resumeId, base: saved.base }) && resumeCheck && revision===viewRef.current.revision) await openReview(resumeId) })
        } catch (error) { setError(String(error)) }
      }}><h3>{editor.id ? '编辑' : '添加'}{editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务'}</h3>
        {editor.type === 'member' ? <>{field('name', '名称')}<div className={css.memberModelSettings}><strong>模型与 Thinking</strong>{modelDirectory && t ? <StagedModelPicker directory={modelDirectory} t={t} provider={draft['provider'] ?? ''} model={draft['model'] ?? ''} reasoningEffort={draft['reasoningEffort'] ?? ''} busy={working} onChange={selection => setDraft(prev => ({ ...prev, ...selection, routeChanged: 'yes' }))} /> : <p className={css.hint}>模型目录暂不可用，请在 DSH 团队活动页面打开编辑。</p>}</div>{field('summary', 'Summary · 功能概述', true)}{field('role', '长期职责', true)}{field('executionPrompt', '执行指令 / PE', true)}</>
          : <>{field('subject', '任务名称')}{field('description', '任务要求 / 验收要求', true)}{editor.type !== 'check' && <label>执行 Agent<select value={draft['assignee'] ?? ''} onChange={e => setDraft({ ...draft, assignee: e.target.value })}><option value="">由空闲成员领取</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name}>{m.name}</option>)}</select></label>}
            <p className={css.hint}>保存节点后，直接拖动画布中的连接柄建立关系。点击连线可查看两端并删除。</p></>}
        {editor.type === 'member' && editor.id && <TaskRerunPicker tasks={team.tasks} member={editor.id} taskId={draft['rerunTaskId'] ?? ''} instructions={draft['rerunInstructions'] ?? ''} disabled={working} onTask={id => setDraft(prev => ({ ...prev, rerunTaskId: id }))} onInstructions={text => setDraft(prev => ({ ...prev, rerunInstructions: text }))} />}
        {editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && <p className={css.hint}>上游重跑后，此节点等待你确认。{team.tasks.find(task => task.id === editor.id)!.dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed') ? `尚未完成：${team.tasks.find(task => task.id === editor.id)!.dependencies.filter(id => team.tasks.find(task => task.id === id)?.status !== 'completed').map(id => team.tasks.find(task => task.id === id)?.subject ?? id).join('、')}` : '上游已完成，确认后使用最新结果。'}</p>}
        {feedback && <p role="status">{feedback}</p>}<p className={css.hint}>切换对象会保留未保存的草稿；刷新页面前请保存。</p>{draftStale && <p role="alert">当前对象已变化，草稿仍保留。<button type="button" onClick={() => { if(draftId) updateView(current=>{const drafts={...current.drafts};delete drafts[draftId];return {...current,drafts}}) }}>重新载入</button></p>}
        <footer><button className={css.primary} disabled={working}>保存</button>
          {editor.type === 'member' && editor.id && rerunnableTasks(team.tasks,editor.id).some(task=>task.id===draft['rerunTaskId']) && <button type="submit" data-rerun="true" disabled={working}>保存并仅重跑所选任务</button>}
          {editor.id && editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowPaused && <button type="submit" data-resume="true" disabled={working || (team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && team.tasks.find(task => task.id === editor.id)!.dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed'))}>保存并确认{editor.type === 'check' ? '重新验收' : '执行'}</button>}
          {editor.id && editor.type !== 'member' && <button type="button" disabled={working} onClick={() => void deleteNode(editor.id!)}>删除节点</button>}
          {editor.type === 'check' && editor.id && data.ready.includes(editor.id) && <button type="button" disabled={working} onClick={() => void openReview(editor.id!)}>开始验收 ↗</button>}<button type="button" onClick={cancelEdit}>放弃修改</button>
          {editor.type === 'member' && editor.id && <button type="button" disabled={working} onClick={() => void saveEdit([{ action: 'remove_member', name: editor.id! }], `移除 ${editor.id}`, true)}>移除成员</button>}</footer>
      </form>}
      </div>}
    </section>, document.body)}
  </>
}
