/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { TeamState, TeamTask } from '../types.ts'
import type { WorkflowOperation } from '../workflow-types.ts'
import css from './WorkflowWorkbench.module.css'
import { TaskRecord, WorkflowContext } from './WorkflowContext.tsx'
import { connectionIssue, connectionTarget } from './workflow-connections.ts'
import { LEAD_ART, REVIEW_ART, memberArtUrl } from './artwork.ts'
import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { AgentTeamsTranslate } from './locales.ts'
import { StagedModelPicker } from './StagingPlanEditor.tsx'
import { EmbeddedDiscussion } from './EmbeddedDiscussion.tsx'
import { ProposalReview, type ProposalReviewDraft } from './ProposalReview.tsx'
import { TaskRerunPicker } from './TaskRerunPicker.tsx'
import { rerunImpact, rerunnableTasks } from '../task-rerun.ts'
import { draftSource, editorKey, editorTarget, finishWorkbenchSave, initialEditorDraft, initialWorkbenchView, selectWorkbench, targetDiscussion, type EditorTarget, type WorkbenchTarget, type WorkbenchView } from './workbench-selection.ts'
import { publishWorkflowActivity, type ActivityTeam } from './activity-monitor.ts'
import { arrangeTasks, clampZoom, fitGraph } from './workflow-layout.ts'
import { decodeDrafts, draftStorageKey, pendingDrafts, propertyOperation } from './workbench-drafts.ts'
import { taskReadiness } from './task-readiness.ts'

interface Response { team: TeamState; base: string; ready: string[]; busy: string[]; openedSessionId?: string; currentDiscussion?: string; activity?:ActivityTeam }
async function request(payload: Record<string, unknown>): Promise<Response | undefined> {
  const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const result = await response.json() as Response & { error?: string }
  if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`)
  if (!result.team) return
  return result
}


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

export function WorkflowWorkbench({ sessionId, teamId, archived = false, waitingCount = 0, openExecution, openConversation, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t }: {
  archived?: boolean
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
  const [editing, setEditing] = useState(false)
  const [archiveView, setArchiveView] = useState(archived)
  const [data, setData] = useState<Response>()
  const [activeId, setActiveId] = useState(teamId)
  const [view, setView] = useState(initialWorkbenchView)
  const viewRef = useRef(view)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ProposalReviewDraft>>({})
  const [working, setWorking] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [storageError, setStorageError] = useState('')
  const loadedDraftScope = useRef<string>()
  const [note, setNote] = useState('')
  const [embeddedDiscussion, setEmbeddedDiscussion] = useState<string>()
  const [pane, setPane] = useState<'members' | 'flow' | 'discussion'>('flow')
  const [name, setName] = useState('新团队')
  const [goal, setGoal] = useState('')

  const [zoom, setZoom] = useState(1)
  const [library, setLibrary] = useState<'tasks' | 'agents'>('tasks')
  const [panMode, setPanMode] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [inspectorWidth, setInspectorWidth] = useState(360)
  const [inspectorExpanded, setInspectorExpanded] = useState(false)
  const [inspectorHidden, setInspectorHidden] = useState(false)
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
  const editor = !archiveView && editing ? editorTarget(team, selection, true) : undefined
  const draftId = editor ? editorKey(team?.id ?? '', editor) : undefined
  const draftEntry = draftId ? view.drafts[draftId] : undefined
  const draft = draftEntry?.values ?? (editor ? initialEditorDraft(team, editor).values : {})
  const draftStale = !!editor && !!draftEntry && draftEntry.source !== draftSource(team, editor)
  const highlightedTask = selectedTask ?? (discussion.startsWith('check:') ? discussion.slice(6) : discussion.startsWith('task:') ? discussion.slice(5) : undefined)
  const relatedMember = selection.type === 'member' ? selection.id : selectedTask ? team?.tasks.find(task => task.id === selectedTask)?.assignee : discussion.startsWith('member:') ? discussion.slice(7) : undefined
  const conversation = team?.workflow?.discussions[`discussion:${discussion}`]
  const proposal = conversation?.proposal?.status === 'pending' ? conversation.proposal : undefined
  const reviewTask = discussion.startsWith('check:') ? team?.tasks.find(t => t.id === discussion.slice(6)) : undefined
  const discussionTask = discussion.startsWith('task:') ? team?.tasks.find(t => t.id === discussion.slice(5) && !t.checkpoint) : undefined
  const activeTask = team?.tasks.find(t => t.id === selectedTask)
  const terminalEdit = !!editor && editor.type !== 'member' && !!activeTask && !activeTask.checkpoint && ['completed','failed','cancelled'].includes(activeTask.status)
  const member = discussion.startsWith('member:') ? team?.members.find(m => m.name === discussion.slice(7)) : undefined
  const defaultPositions = useMemo(() => arrangeTasks(team?.tasks ?? []), [team?.tasks])
  const taskEditing = !!editor && editor.type !== 'member'
  const unsaved = pendingDrafts(team, view.drafts)
  const currentDirty = unsaved.some(item => item.key === draftId)
  const unconfigured = team?.tasks.filter(task => task.workflowConfigPending) ?? []
  const taskStatus = (task: TeamTask, _ready: string[]) => taskReadiness(team!, task).label
  useEffect(() => {
    if (!activeId || !team || team.id !== activeId) return
    const scope = draftStorageKey(sessionId, activeId)
    if (loadedDraftScope.current !== scope) {
      loadedDraftScope.current = scope
      try {
        const restored = decodeDrafts(sessionStorage.getItem(scope), activeId)
        updateView(current => ({...current, drafts:{...restored,...current.drafts}}))
        setStorageError('')
      } catch { setStorageError('当前浏览器无法保存草稿，刷新前请保存属性。') }
      return
    }
    try {
      const drafts = Object.fromEntries(pendingDrafts(team, view.drafts).map(item => [item.key,item.entry]))
      if (Object.keys(drafts).length) sessionStorage.setItem(scope, JSON.stringify({version:1,drafts}))
      else sessionStorage.removeItem(scope)
      setStorageError('')
    } catch { setStorageError('草稿备份失败，刷新前请保存属性。') }
  }, [sessionId, activeId, team, view.drafts])
  useEffect(() => {
    if (!storageError || !unsaved.length) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [storageError, unsaved.length])
  useEffect(() => { onNativeContext?.(!!data?.currentDiscussion) }, [data?.currentDiscussion, onNativeContext])
  function updateView(update: (current: WorkbenchView) => WorkbenchView): void { const next = update(viewRef.current); viewRef.current = next; setView(next) }
  function choose(target: WorkbenchTarget, overrides?: Record<string,string>): void {
    updateView(current => selectWorkbench(current, target, team, overrides)); setError(''); setFeedback('')
    setInspectorHidden(false)
    if (target.type === 'member') setLibrary('agents')
    if (target.type === 'task' || target.type === 'check') setLibrary('tasks')
    setPane(target.type === 'member' ? 'discussion' : target.type === 'task' || target.type === 'check' || target.type === 'edge' ? 'flow' : 'discussion')
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
  useEffect(() => { setArchiveView(archived) }, [archived])
  useEffect(() => {
    if (!opened) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('button, input')?.focus()
    return () => { document.body.style.overflow = overflow; previous?.focus() }
  }, [opened])
  useEffect(() => {
    if (editor && !editor.id) dialog.current?.querySelector<HTMLElement>('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus()
  }, [editor])
  useEffect(() => { if (teamId && teamId !== activeId) { setActiveId(teamId); setData(undefined); updateView(current => ({...initialWorkbenchView(),revision:current.revision+1})); setPositions({}); initializedDiscussion.current = false; generation.current++ } }, [sessionId, teamId])
  const refresh = async (): Promise<void> => {
    const token = generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, action: archiveView ? 'archive_state' : 'state' })
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
  }, [activeId, working, archiveView])
  async function perform(action: string, fields: Record<string, unknown> = {}): Promise<Response | undefined> {
    if(archiveView && action !== 'restore_archive') {setError('请先恢复归档，再修改或重新执行。');return}
    setWorking(true)
    const saving = action === 'edit' || action === 'layout'
    if (saving) setSaveState('saving')
    setError(''); setFeedback(''); const token = ++generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, discussion, action, ...fields })
      if (!result) { if (saving) setSaveState('error'); return }
      if (saving) setSaveState('saved')
      if(action==='restore_archive') {setArchiveView(false);setEditing(false);setFeedback('已恢复为待确认流程。已完成成果保留；确认成员配置并启动后，可修改和重跑。')}
      if(result.activity) publishWorkflowActivity(result.activity)
      if (mounted.current && token === generation.current) { setData(result); setActiveId(result.team.id) }
      return result
    } catch (err) { if (mounted.current) { setError(err instanceof Error ? err.message : String(err)); if (saving) setSaveState('error') }; return undefined }
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
  async function saveAllProperties(): Promise<void> {
    if (!team || working || archiveView) return
    const submitted = pendingDrafts(team, viewRef.current.drafts), revision = viewRef.current.revision
    if (!submitted.length) return
    try {
      if (submitted.length > 50) throw new Error('一次最多保存 50 个对象，请先逐项保存部分草稿。')
      const operations = submitted.map(item => propertyOperation(team,item.target,item.entry))
      const result = await saveEdit(operations, '保存全部属性草稿')
      if (!result) return
      updateView(current => {
        let next = current
        for (const item of submitted) next = finishWorkbenchSave(next,item.key,item.entry,revision,result.team,undefined,item.target)
        if (current.revision === revision && selection.type === 'member' && !selection.id) {
          const added = submitted.find(item => item.target.type === 'member' && !item.target.id)
          if (added) next = selectWorkbench(next,{type:'member',id:added.entry.values['name']!.trim()},result.team)
        }
        return next
      })
      setFeedback('本次提交的属性已保存；待配置节点仍需单独完成配置，任务不会自动重跑。')
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
  }
  function locateTask(id: string): void {
    const task = team?.tasks.find(item => item.id === id)
    if (!task) return
    choose({type:task.checkpoint ? 'check' : 'task',id})
    requestAnimationFrame(() => { const p = pos(id); canvas.current?.scrollTo({left:Math.max(0,p.x*zoom-48),top:Math.max(0,p.y*zoom-48),behavior:'smooth'}) })
  }
  function renderReadiness(task: TeamTask) {
    if (!team) return null
    const state = taskReadiness(team,task)
    return <section className={css.readiness} aria-label="执行条件"><strong>{state.label}</strong><p>{state.detail}</p>{state.dependencies.map(id => <button type="button" key={id} onClick={() => locateTask(id)}>定位 · {team.tasks.find(item => item.id === id)?.subject ?? id}</button>)}</section>
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
    if (!target || !selectedEdge || working || archiveView || !editing) return
    const revision=viewRef.current.revision
    if(await saveEdit([{ action: 'update_task', id: target.id, dependencies: target.dependencies.filter(id => id !== selectedEdge.from) }], '删除任务交接') && revision===viewRef.current.revision) selectDiscussion('graph')
  }
  async function deleteNode(id: string): Promise<void> {
    if (!team || working || archiveView || !editing) return
    const updates: WorkflowOperation[] = team.tasks.filter(task => task.dependencies.includes(id)).map(task => ({ action: 'update_task', id: task.id, dependencies: task.dependencies.filter(dep => dep !== id) }))
    updates.push({ action: 'remove_task', id })
    const revision=viewRef.current.revision
    if (await perform('edit', { operations: updates, title: '删除节点及其连接', base: data?.base, positions: Object.fromEntries(team.tasks.map(task => [task.id, pos(task.id)])) })) {
      updateView(current => { const drafts={...current.drafts}; delete drafts[editorKey(team.id,{type:'task',id})]; delete drafts[editorKey(team.id,{type:'check',id})]; return {...current,drafts} })
      if (revision===viewRef.current.revision) selectDiscussion('graph')
    }
  }
  function beginNodeDrag(event: ReactPointerEvent<HTMLElement>, task: TeamTask): void {
    suppressNodeClick.current=false
    if (panMode || event.button !== 0 || working || archiveView || !editing || (event.target as HTMLElement).closest('[data-connection-handle]')) return
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
  function edit(type: EditorTarget['type'], id?: string, overrides?: Record<string,string>): void { if(!archiveView) setEditing(true); choose({type,id},overrides) }
  const field = (key: string, label: string, multiline = false) => <label>{label}{multiline
    ? <textarea required={(key === 'summary' && !editor?.id) || (key === 'description' && !!activeTask?.workflowConfigPending)} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
    : <input required={key === 'name' || key === 'subject' || (key === 'summary' && !editor?.id)} value={draft[key] ?? ''} disabled={key === 'name' && (!!editor?.id || working)} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}</label>
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
    setZoom(fitGraph(canvas.current.clientWidth, canvas.current.clientHeight, graphWidth, graphHeight))
    canvas.current.scrollTo(0, 0)
  }
  function changeZoom(value: number, clientX?: number, clientY?: number): void {
    const viewport = canvas.current
    if (!viewport) return
    const bounds = viewport.getBoundingClientRect(), next = clampZoom(value)
    const x = clientX === undefined ? viewport.clientWidth / 2 : clientX - bounds.left
    const y = clientY === undefined ? viewport.clientHeight / 2 : clientY - bounds.top
    const left = (viewport.scrollLeft + x) * next / zoom - x
    const top = (viewport.scrollTop + y) * next / zoom - y
    setZoom(next)
    requestAnimationFrame(() => viewport.scrollTo(Math.max(0, left), Math.max(0, top)))
  }
  useEffect(() => {
    const viewport = canvas.current
    if (!opened || !viewport) return
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      changeZoom(zoom * Math.exp(-event.deltaY * .002), event.clientX, event.clientY)
    }
    viewport.addEventListener('wheel', wheel, { passive: false })
    return () => viewport.removeEventListener('wheel', wheel)
  }, [opened, zoom, !!team])
  function beginPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 && event.button !== 1) return
    const blank = event.target === event.currentTarget || (event.target as HTMLElement).classList.contains(css.plane!)
    if (event.button !== 1 && !panMode && !blank) return
    event.preventDefault(); event.stopPropagation()
    const target = event.currentTarget, x = event.clientX, y = event.clientY
    const left = target.scrollLeft, top = target.scrollTop
    let moved = false
    target.setPointerCapture(event.pointerId)
    target.onpointermove = move => {
      if (Math.hypot(move.clientX - x, move.clientY - y) > 4) moved = true
      target.scrollTo(left - move.clientX + x, top - move.clientY + y)
    }
    const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId) }
    target.onpointerup = () => { cleanup(); if (!moved && blank && !panMode) selectDiscussion('graph') }
    target.onpointercancel = cleanup
  }
  function resizeInspector(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget, right = target.parentElement!.getBoundingClientRect().right
    setInspectorExpanded(false)
    target.setPointerCapture(event.pointerId)
    target.onpointermove = move => setInspectorWidth(Math.max(300, Math.min(720, right - move.clientX)))
    const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId) }
    target.onpointerup = cleanup; target.onpointercancel = cleanup
  }
  async function arrangeCanvas(): Promise<void> {
    if (!team || working || archiveView) return
    const result = await perform('layout', { positions: defaultPositions })
    if (result) { setPositions({}); setFeedback('已按任务依赖整理布局。') }
  }
  async function createNode(type: 'task' | 'check'): Promise<void> {
    if (!team || working || archiveView) return
    const revision = viewRef.current.revision
    const label = type === 'check' ? '人工检查' : '新任务'
    let number = team.tasks.length + 1
    while (team.tasks.some(task => task.subject === `${label} ${number}`)) number++
    const result = await saveEdit([{ action: 'add_task', subject: `${label} ${number}`, checkpoint: type === 'check', configurationPending: true, dependencies: [] }], `创建${label}`)
    if (!result || revision !== viewRef.current.revision) return
    const added = result.team.tasks.find(task => !team.tasks.some(old => old.id === task.id))
    if (!added) return
    setEditing(true); setPanMode(false)
    updateView(current => selectWorkbench(current, { type, id: added.id }, result.team))
    setLibrary('tasks'); setPane('flow'); setInspectorHidden(false)
    setFeedback('节点已保存，可直接连线；填写要求并完成配置前不会执行或进入验收。')
    requestAnimationFrame(() => {
      const p = result.team.workflow?.positions[`task:${added.id}`]
      if (p) canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' })
    })
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
  const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => !archiveView && key.startsWith('discussion:') && item.proposal?.status === 'pending').map(([, item]) => item)
  const pendingCount = pendingProposals.length
  const pendingNotice = pendingCount > 0 && <div className={css.pendingNotice} role="status"><strong>有 {pendingCount} 项修改等待确认</strong>
    {pendingProposals.map(item => <button type="button" key={item.key} onClick={() => { selectDiscussion(item.key); setOpened(true) }}>查看并决定 · {item.proposal!.title}</button>)}
    {!!editor && <small>切换查看会保留当前草稿。</small>}
  </div>
  const reviewCount = archiveView ? 0 : data?.ready.length ?? waitingCount
  const reviewNotice = !archiveView && !!data?.ready.length && <div className={css.reviewNotice} role="status" aria-label="等待你验收">
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
      {!nativeOnly && <span>{archiveView ? '归档画布 · ' : ''}{team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队')}</span>}
      {pendingCount > 0 && <span>{pendingCount} 项修改待确认</span>}
      {reviewCount > 0 && <span>{reviewCount} 项等待人工验收</span>}
    </button>}
    {!nativeOnly && !reviewEntryOnly && !archiveView && team?.phase === 'staged' && <button type="button" className={`${css.entry} ${css.startEntry}`} disabled={working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0} title={unsaved.length ? '请先保存属性草稿' : unconfigured.length ? '请先完成待配置节点' : pendingCount ? '请先处理待确认的修改' : undefined} onClick={() => void perform('start')}>确认并启动团队</button>}
    {!opened && !nativeOnly && !reviewEntryOnly && pendingNotice}
    {error && !opened && <div className={css.error} role="alert">{error}</div>}
    {!nativeOnly && reviewNotice}
    {nativeOnly && data?.currentDiscussion && openContext && <button className={`${css.entry} ${css.compact}`} onClick={openContext}>{proposal ? '查看待确认修改 ↗' : '团队与讨论资料 ↗'}</button>}
    {embeddedContext && team && <section className={css.contextPanel} aria-label="讨论资料"><header><strong>讨论资料</strong><span>当前已保存的信息</span></header><label>查看对象<select value={discussion} onChange={event => selectDiscussion(event.target.value)}><option value="graph">团队与流程</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name} value={`member:${m.name}`}>{m.name}</option>)}{team.tasks.map(t => <option key={t.id} value={`${t.checkpoint ? 'check' : 'task'}:${t.id}`}>{t.checkpoint ? '验收' : '任务'} · {t.subject}</option>)}</select></label>
      {feedback && <p role="status">{feedback}</p>}
      {conversation?.materials && <details><summary>本轮验收证据</summary><ReviewMaterials text={conversation.materials} /></details>}
      {proposal && !opened && <section className={css.contextProposal} aria-label="待确认修改">{renderProposalReview()}<button onClick={() => { setPane('discussion'); setOpened(true) }}>在画布查看 ↗</button></section>}
      <WorkflowContext team={team} discussion={discussion} onSelect={selectDiscussion} openExecution={openExecution} />
    </section>}
    {opened && createPortal(<section ref={dialog} className={css.workbench} data-maximized={maximized} data-editing={!!editor || !!selectedEdge || !!activeTask} role="dialog" aria-modal="true" aria-label="TeamFlow 编排工作台" onKeyDown={event => {
      if (!archiveView && editing && (event.key === 'Delete' || event.key === 'Backspace') && (selectedEdge || selectedTask) && !(event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) { event.preventDefault(); if (selectedEdge) void deleteEdge(); else if (selectedTask) void deleteNode(selectedTask); return }
      if (event.key === 'Escape') { if (cancelLink.current) { cancelLink.current(); return }; if (editor) { setEditing(false); setFeedback('已退出编辑，未保存的草稿已保留。') } else closeWorkbench() }
      if (event.key === 'Tab') {
        const scope = dialog.current
        const items = [...scope?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') ?? []].filter(el => el.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }}>
      <header className={css.header}><div className={css.title}><img src={LEAD_ART} alt="" /><div><strong>{team?.name ?? '创建团队'}</strong><span>{archiveView ? '归档画布 · 成果与详情完整保留' : team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台'}</span></div></div>
        <div>{archiveView ? <button className={css.primary} disabled={working} onClick={() => void perform('restore_archive')}>恢复并编辑流程</button> : <button aria-pressed={editing} onClick={() => {setEditing(!editing);updateView(current=>({...current,revision:current.revision+1}))}}>{editing ? '查看流程' : '编辑流程'}</button>}
          {!archiveView && team?.phase === 'staged' && <button className={css.primary} disabled={working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0} title={unsaved.length ? '请先保存属性草稿' : unconfigured.length ? '请先完成待配置节点' : pendingCount ? '请先处理待确认的修改' : undefined} onClick={() => void perform('start')}>确认并启动</button>}
          <button aria-pressed={maximized} onClick={() => setMaximized(!maximized)}>{maximized ? '退出全屏' : '全屏'}</button>
          <button onClick={closeWorkbench} aria-label="关闭编排工作台">关闭</button></div></header>
      {team && <nav className={css.commandBar} aria-label="创建与视图">
        <strong>创建</strong><button disabled={working || archiveView} onClick={() => void createNode('task')}>＋ 任务节点</button><button disabled={working || archiveView} onClick={() => void createNode('check')}>◇ 人工节点</button><button disabled={working || archiveView} onClick={() => edit('member')}>＋ Agent</button>
        <span className={css.commandSpacer} /><button aria-pressed={!inspectorHidden} onClick={() => { setPane(inspectorHidden ? 'discussion' : 'flow'); setInspectorHidden(!inspectorHidden) }}>{inspectorHidden ? '显示右侧面板' : '收起右侧面板'}</button>
      </nav>}
      {team && <section className={css.saveBar} aria-label="保存状态">
        <span role="status">{saveState === 'saving' ? '正在保存画布…' : saveState === 'error' ? '上次保存失败，请重试' : '节点与连线自动保存'} · {unsaved.length ? `${unsaved.length} 个对象有未保存属性` : '属性已保存'}</span>
        {!!unsaved.length && <><button disabled={working || archiveView} onClick={() => void saveAllProperties()}>保存全部属性</button><details><summary>查看未保存对象</summary>{unsaved.map(item => <button key={item.key} onClick={() => edit(item.target.type,item.target.id)}>{item.label} · 未保存</button>)}</details></>}
        {!!unconfigured.length && <details><summary>{unconfigured.length} 个节点待配置</summary>{unconfigured.map(task => <button key={task.id} onClick={() => {setEditing(true);locateTask(task.id)}}>{task.subject} · 去配置</button>)}</details>}
        {storageError && <span role="alert">{storageError}</span>}
      </section>}
      {team && <nav className={css.paneTabs} aria-label="工作台视图">{(['members', 'flow', 'discussion'] as const).map(value => <button key={value} aria-pressed={pane === value} onClick={() => { setPane(value); setInspectorExpanded(false); if (value === 'discussion') setInspectorHidden(false) }}>{value === 'members' ? '对象列表' : value === 'flow' ? '任务流程' : '修改与验收'}{value === 'discussion' && proposal && <i aria-label="有待确认的修改" />}</button>)}</nav>}
      {pendingNotice}
      {!!team?.tasks.some(task => task.workflowRerunRequired) && <details className={css.suspendedNotice} open><summary>上游已重跑 · {team.tasks.filter(task => task.workflowRerunRequired).length} 个下游节点等待你确认</summary><p>此前结果已失效。上游完成后，点击节点可修改要求，再确认执行或重新验收。</p>{team.tasks.filter(task => task.workflowRerunRequired).map(task => <button key={task.id} onClick={() => { edit(task.checkpoint ? 'check' : 'task', task.id) }}>{task.subject} · {task.dependencies.every(id => team.tasks.find(item => item.id === id)?.status === 'completed') ? '可确认' : '等待上游'}</button>)}</details>}
      {error && <div className={css.error} role="alert">{error}</div>}
      {archiveView && <p className={css.notice}>归档画布 · 可查看全部节点、连接与成果。恢复并编辑将保留原归档和已完成成果，建立待确认流程，不会自动执行。</p>}
      {feedback && !editor && <p className={css.notice} role="status">{feedback}</p>}
      {!activeId ? <form className={css.create} onSubmit={e => { e.preventDefault(); void createFlow() }}>
        <h2>描述目标，一起规划团队</h2><label>团队名称<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>团队目标<textarea required value={goal} onChange={e => setGoal(e.target.value)} /></label><button className={css.primary} disabled={working}>在 DSH 中讨论方案 ↗</button>
      </form> : !team ? <p role="status">正在读取团队…</p> : <div className={css.columns} style={{ '--inspector-width': `${inspectorWidth}px` } as CSSProperties} data-inspector-hidden={inspectorHidden} data-inspector-expanded={inspectorExpanded} data-pane={pane} data-editing={!!editor || !!selectedEdge || !!activeTask}>
        <aside className={css.roster} aria-label="对象列表">
          <nav className={css.libraryTabs} aria-label="对象分类"><button aria-pressed={library === 'tasks'} onClick={() => setLibrary('tasks')}>▤ 任务 {team.tasks.length}</button><button aria-pressed={library === 'agents'} onClick={() => setLibrary('agents')}>◉ Agent {team.members.filter(m => archiveView || m.status !== 'removed').length}</button></nav>
          {library === 'tasks' ? <section className={css.taskList}><h3>任务流程</h3><p className={css.hint}>任务决定做什么，Agent 决定由谁执行。</p>{team.tasks.map(task => <button key={task.id} data-kind={task.checkpoint ? 'check' : 'task'} aria-pressed={selectedTask === task.id} onClick={() => {
            choose({ type: task.checkpoint ? 'check' : 'task', id: task.id }); setPane('flow')
            requestAnimationFrame(() => { const p = pos(task.id); canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' }) })
          }}><small>{task.checkpoint ? '◇ 人工节点' : '▤ 任务节点'} · {task.id}</small><strong>{task.subject}{unsaved.some(item => item.target.id === task.id && item.target.type !== 'member') && <em className={css.dirtyDot}> · 未保存</em>}</strong><span title={taskReadiness(team,task).detail}>{taskStatus(task, data.ready)}</span></button>)}{!team.tasks.length && <p className={css.hint}>从顶部创建任务节点或人工节点。</p>}</section> : <><h3>Agent 成员 <button disabled={working || archiveView} aria-label="添加成员" onClick={() => edit('member')}>＋ 添加</button></h3>
          {team.members.filter(m => archiveView || m.status !== 'removed').map(m => <article key={m.name} className={relatedMember === m.name ? css.selected : ''} onClick={event => { if (!(event.target as HTMLElement).closest('button')) { edit('member', m.name) } }}>
            <button className={css.member} aria-pressed={selection.type === 'member' && selection.id === m.name} onClick={() => { edit('member', m.name) }}><img src={memberArtUrl(m.name, m.role ?? '')} alt="" /><span><strong>{m.name}{unsaved.some(item => item.target.type === 'member' && item.target.id === m.name) && <em className={css.dirtyDot}> · 未保存</em>}</strong><span>{m.summary || m.role || '尚未填写职责概述'}</span></span></button>
            <small>◉ Agent · {m.model || '继承队长模型'}</small><div><button disabled={working || archiveView} onClick={() => prepareDiscussion(m.name)}>讨论调整 ↗</button>
              {m.id && openExecution && <button onClick={() => { openExecution(m.id, team.captainSessionId); closeWorkbench() }}>执行对话 ↗</button>}
              {openExecution && m.previousSessionIds?.map((id, i) => <button key={id} onClick={() => { openExecution(id, team.captainSessionId); closeWorkbench() }}>历史执行 {i + 1} ↗</button>)}</div>
          </article>)}
          <p className={css.hint}>{archiveView ? '点击成员查看保存的配置与执行记录；恢复并编辑后可调整。' : '点击成员卡片直接编辑；讨论调整默认继续该成员的独立讨论，保留历史上下文。'}</p></>}
        </aside>
        <main className={css.graphArea}>
          <nav className={css.toolbar} aria-label="画布工具"><button aria-pressed={!panMode} onClick={() => setPanMode(false)}>↖ 选择</button><button aria-pressed={panMode} onClick={() => setPanMode(true)}>✥ 平移</button><button aria-label="缩小画布" disabled={zoom <= .1} onClick={() => changeZoom(zoom - .1)}>−</button><button title="恢复 100%" aria-label={`缩放 ${Math.round(zoom * 100)}%，点击恢复 100%`} onClick={() => changeZoom(1)}>{Math.round(zoom * 100)}%</button><button aria-label="放大画布" disabled={zoom >= 2} onClick={() => changeZoom(zoom + .1)}>＋</button><button onClick={fitCanvas}>适应画布</button><button disabled={working || archiveView || !team.tasks.length} onClick={() => void arrangeCanvas()}>自动整理</button></nav>
          {reviewNotice}
          <div className={css.canvas} data-pan={panMode} ref={canvas} onPointerDownCapture={beginPan}>
            <div className={css.plane} style={{ width: graphWidth, height: graphHeight, zoom }}>
              <svg className={css.edges} aria-label="任务交接连线"><defs><marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor" /></marker></defs>
                {team.tasks.flatMap(t => t.dependencies.map(dep => { const a = pos(dep), b = pos(t.id); const path = `M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`; return <g key={`${dep}-${t.id}`} data-selected={selectedEdge?.from === dep && selectedEdge.to === t.id} className={css.edge}>
                  <path d={path} markerEnd="url(#workflow-arrow)" />
                  <path className={css.edgeHit} d={path} role="button" tabIndex={0} aria-label={`交接：${team.tasks.find(task => task.id === dep)?.subject ?? dep} → ${t.subject}`} aria-pressed={selectedEdge?.from === dep && selectedEdge.to === t.id} onClick={() => { choose({ type:'edge',from:dep,to:t.id }) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose({ type:'edge',from:dep,to:t.id }) } }} />
                </g> }))}
                {link && <path d={`M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}`} />}
              </svg>
              {team.tasks.map(task => { const p = pos(task.id); return <article key={task.id} data-member-match={selection.type === 'member' && !!selection.id && task.assignee === selection.id || undefined} data-connection={link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined} data-review-ready={!!task.checkpoint && data.ready.includes(task.id)} data-config-pending={task.workflowConfigPending || undefined} data-suspended={task.workflowRerunRequired || undefined} className={`${css.node} ${task.checkpoint ? css.checkpoint : ''} ${highlightedTask === task.id ? css.selected : ''}`} style={{ left: p.x, top: p.y }} onPointerDown={event => beginNodeDrag(event, task)} onClick={event => { if ((event.target as HTMLElement).closest('[data-connection-handle]')) return; if (suppressNodeClick.current) { suppressNodeClick.current = false; return }; if(editing && !archiveView) edit(task.checkpoint ? 'check' : 'task', task.id); else choose({type:task.checkpoint ? 'check' : 'task',id:task.id}) }}>
                <div className={css.drag}>⠿ {task.checkpoint ? '◇ 人工节点' : '▤ 任务节点'} · {task.id}</div>
                <button className={css.nodeBody} >
                  <strong title={task.subject}>{task.subject}</strong><span className={css.taskOwner} title={task.assignee}>{task.checkpoint ? '人工验收 · 由你确认' : `执行 Agent · ${task.assignee || '自动分配'}`}</span><small title={taskReadiness(team,task).detail} data-ready={data.ready.includes(task.id)}>{taskStatus(task, data.ready)}</small></button>
                <button className={`${css.port} ${css.input}`} data-connection-handle data-input-id={task.id} aria-label={`${task.subject} 输入端`} />
                <button className={`${css.port} ${css.output}`} data-connection-handle aria-label={`${task.subject} 输出端`} disabled={working || archiveView || !editing || (taskEditing && !editor?.id)} title="从这里拖出连接线" onPointerDown={event => {
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
          <footer className={css.canvasStatus} role="status">{link ? link.issue ?? (link.to ? '已吸附 · 松开连接' : '拖到下游节点 · Esc 取消') : `${team.tasks.length} 个任务节点 · 拖动空白处平移 · Ctrl / ⌘ + 滚轮缩放${editing ? ' · 拖动右侧箭头连线 · Delete 删除' : ' · 点击节点查看详情'}`}</footer>
        </main>
        <div className={css.resizeHandle} role="separator" aria-label="调整右侧面板宽度" aria-orientation="vertical" aria-valuemin={300} aria-valuemax={720} aria-valuenow={inspectorWidth} tabIndex={inspectorHidden ? -1 : 0} onPointerDown={resizeInspector} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setInspectorExpanded(false); setInspectorWidth(value => Math.max(300, Math.min(720, value + (event.key === 'ArrowLeft' ? 40 : -40)))) } }} />
        <section className={css.inspector} aria-label="属性与讨论面板"><header className={css.inspectorHeader}><strong>{editor ? '编辑属性' : activeTask || selectedEdge ? '节点与连接' : '讨论与验收'}</strong><button aria-pressed={inspectorExpanded} onClick={() => setInspectorExpanded(!inspectorExpanded)}>{inspectorExpanded ? '还原面板' : '放大面板'}</button></header>
          {selectedEdge && <aside className={css.editor} aria-label="交接详情"><strong>{team.tasks.find(task => task.id === selectedEdge.from)?.subject} → {team.tasks.find(task => task.id === selectedEdge.to)?.subject}</strong><p>上游完成后，下游才开始。编辑时按 Delete 删除；已开始的下游需先停止。</p><button disabled={working || archiveView || !editing} onClick={() => void deleteEdge()}>删除连线</button></aside>}
          {activeTask && !editor && !selectedEdge && <aside className={css.editor} aria-label={activeTask.checkpoint ? '人工验收属性' : '任务属性'}><h3>{activeTask.checkpoint ? '人工验收属性' : '任务属性'}</h3><strong>{activeTask.subject}</strong>{renderReadiness(activeTask)}<p>{activeTask.description || '暂无任务说明'}</p><p>{taskStatus(activeTask,data.ready)} · {activeTask.id}</p>{activeTask.checkpoint && <p>第 {activeTask.checkpoint.round} 轮 · {activeTask.checkpoint.note || '暂无验收意见'}</p>}<div>
            {!archiveView && !activeTask.checkpoint && <button className={css.primary} disabled={working} onClick={() => void startEmbedded(`task:${activeTask.id}`)}>与 AI 讨论任务</button>}
            {!archiveView && !activeTask.checkpoint && activeTask.assignee && rerunnableTasks(team.tasks, activeTask.assignee).some(task => task.id === activeTask.id) && <button disabled={working} onClick={() => { edit('member', activeTask.assignee, {rerunTaskId:activeTask.id}) }}>修改负责人并重跑此任务</button>}
            {!archiveView && !activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && <button disabled={working || activeTask.workflowConfigPending} onClick={() => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id, base: data.base })}>{activeTask.workflowPaused ? '继续执行' : '停止任务以编辑'}</button>}
          </div><TaskRecord task={activeTask} team={team} expanded />
            {!archiveView && editorTarget(team,selection,true) && <button onClick={() => setEditing(true)}>编辑节点</button>}
            {!archiveView && activeTask.checkpoint && data.ready.includes(activeTask.id) && <button className={css.primary} disabled={working} onClick={() => void openReview(activeTask.id)}>开始验收</button>}
          </aside>}

        {!editor && !selectedEdge && !activeTask && <aside className={css.discussion}><header><img src={reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART} alt="" /><div><h3>{reviewTask ? `验收 · ${reviewTask.subject}` : discussionTask ? `任务讨论 · ${discussionTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改'}</h3>
          <small>{reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效'}</small></div></header>
          <div className={css.messages}>
            <p className={css.hint}>{reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : discussionTask ? '基于已保存的任务要求、负责人、上下游和提交结果讨论；未保存草稿不会发送给 AI。' : member ? '在这里与独立配置顾问讨论；队长对话保持独立。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。'}</p>
            {discussionTask && <div><button onClick={() => locateTask(discussionTask.id)}>返回任务属性</button><button disabled={working || archiveView} onClick={() => void startEmbedded('graph')}>讨论整体流程与拆分</button></div>}
            {archiveView ? <p className={css.hint}>恢复并编辑流程后可继续讨论。</p> : embeddedDiscussion === discussion && activeId ? <EmbeddedDiscussion key={`${activeId}:${discussion}:${conversation?.native?.sessionId}`} sessionId={sessionId} teamId={activeId} discussion={discussion} /> : <button className={css.primary} disabled={working} onClick={() => member ? prepareDiscussion(member.name) : void startEmbedded(discussion)}>在此处{conversation?.native ? '继续' : '开始'}讨论</button>}
            {embeddedDiscussion === discussion && conversation?.native && openConversation && <button disabled={working} onClick={() => void openDiscussion(discussion)}>打开完整 DSH 对话 ↗</button>}
            <details open={archiveView || selection.type === 'member'}><summary>查看当前资料</summary><WorkflowContext team={team} discussion={discussion} onSelect={key => key.startsWith('member:') ? edit('member', key.slice(7)) : selectDiscussion(key)} openExecution={openExecution} /></details>
            {conversation?.materials && <details open><summary>本轮验收材料与证据</summary><ReviewMaterials text={conversation.materials} /></details>}
            {data.busy.includes(discussion) && <p role="status">原生对话正在整理方案…</p>}
          </div>
          {!archiveView && proposal && <section className={css.proposal}>{renderProposalReview()}</section>}
          {!archiveView && reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && <div className={css.decisions}>
            <button className={css.primary} disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok) setNote('') })}>通过验收</button>
            <button disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) { setNote(''); void startEmbedded(discussion) } })}>退回并讨论返工</button>
          </div>}
          {reviewTask?.checkpoint?.decision === 'reject' && <p className={css.notice}>已退回，下游保持等待。可将新返工节点连入此审核节点，自动进入下一轮审核；也可讨论返工对象并确认新方案。</p>}
          {!archiveView && reviewTask && <div className={css.composer}><label>验收意见（随决定保存）<textarea aria-label="验收意见" value={note} onChange={e => setNote(e.target.value)} placeholder="记录通过或退回的原因…" /></label><button disabled={working || !data.ready.includes(reviewTask.id)} onClick={() => void perform('materials')}>刷新验收材料</button></div>}
          {!archiveView && !data.currentDiscussion && <details><summary>重新开始讨论</summary><p className={css.hint}>新建独立讨论会归档当前讨论，从当前资料重新开始。</p><button disabled={working || data.busy.includes(discussion)} onClick={() => void startEmbedded(discussion, activeId, true)}>新建独立讨论</button></details>}
        </aside>}

      {editor && <form key={`${editor.type}:${editor.id ?? 'new'}`} data-workflow-editor className={css.editor} onSubmit={event => {
        event.preventDefault()
        try {
          const route = draft['routeChanged'] ? { provider: draft['provider'], model: draft['model'], reasoningEffort: draft['reasoningEffort'] || 'default' } : {}
          const operations: WorkflowOperation[] = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'], ...route } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'], ...route }]
            : [editor.id ? { action: terminalEdit ? 'rerun_task' : 'update_task', id: editor.id, ...!terminalEdit && activeTask?.workflowConfigPending ? {confirmConfiguration:true} : {}, subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'] } : { action: 'add_task', checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'], dependencies: [] }]
          const rerun = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-rerun') === 'true'
          if (rerun) {
            if (!editor.id || !draft['rerunTaskId'] || !team.tasks.some(task => task.id === draft['rerunTaskId'] && task.assignee === editor.id)) throw new Error('请选择该成员的已结束任务')
            operations.push({ action: 'rerun_task', id: draft['rerunTaskId'], instructions: draft['rerunInstructions'] })
          }
          const resumeId = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-resume') === 'true' ? editor.id : undefined
          const resumeCheck = editor.type === 'check', revision=viewRef.current.revision
          void saveEdit(operations, rerun ? '调整成员并单独重跑任务' : editor.type === 'member' ? '调整团队成员' : '调整任务', true).then(async saved => { if (saved && resumeId && await perform('resume_task', { taskId: resumeId, base: saved.base }) && resumeCheck && revision===viewRef.current.revision) await openReview(resumeId) })
        } catch (error) { setError(String(error)) }
      }}><h3>{editor.id ? '编辑' : '添加'}{editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务'} <small className={currentDirty ? css.dirtyDot : css.hint}>{currentDirty ? '未保存' : editor.id ? '已保存' : '尚未创建'}</small></h3>
        {editor.type !== 'member' && activeTask && renderReadiness(activeTask)}
        {editor.type === 'task' && activeTask && <><button type="button" disabled={working} onClick={() => void startEmbedded(`task:${activeTask.id}`)}>与 AI 讨论任务</button><small className={css.hint}>讨论使用已保存的资料；当前草稿会保留。</small></>}
        {editor.type === 'member' ? <>{field('name', '名称')}<div className={css.memberModelSettings}><strong>模型与 Thinking</strong>{modelDirectory && t ? <StagedModelPicker directory={modelDirectory} t={t} provider={draft['provider'] ?? ''} model={draft['model'] ?? ''} reasoningEffort={draft['reasoningEffort'] ?? ''} busy={working} onChange={selection => setDraft(prev => ({ ...prev, ...selection, routeChanged: 'yes' }))} /> : <p className={css.hint}>模型目录暂不可用，请在 DSH 团队活动页面打开编辑。</p>}</div>{field('summary', 'Summary · 功能概述', true)}{field('role', '长期职责', true)}{field('executionPrompt', '执行指令 / PE', true)}</>
          : <>{field('subject', '任务名称')}{field('description', '任务要求 / 验收要求', true)}{editor.type !== 'check' && <label>执行 Agent<select value={draft['assignee'] ?? ''} onChange={e => setDraft({ ...draft, assignee: e.target.value })}><option value="">由空闲成员领取</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name}>{m.name}</option>)}</select></label>}
            <p className={css.hint}>节点已在画布中，可直接拖动右侧箭头连线。修改名称或要求后点击保存。</p></>}
        {editor.type !== 'member' && activeTask && <TaskRecord task={activeTask} team={team} expanded />}
        {terminalEdit && activeTask && <><p className={css.notice}>保存将覆盖此任务的当前结果，并挂起下游：{rerunImpact(team.tasks,activeTask.id).descendants.map(task=>task.subject).join('、') || '无'}。其他分支保留；下游需逐个确认。{team.phase === 'staged' ? '请先查看流程并确认启动团队，再重跑。' : ''}</p></>}
        {editor.type === 'member' && editor.id && <TaskRerunPicker tasks={team.tasks} member={editor.id} taskId={draft['rerunTaskId'] ?? ''} instructions={draft['rerunInstructions'] ?? ''} disabled={working} onTask={id => setDraft(prev => ({ ...prev, rerunTaskId: id }))} onInstructions={text => setDraft(prev => ({ ...prev, rerunInstructions: text }))} />}
        {editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && <p className={css.hint}>上游重跑后，此节点等待你确认。{team.tasks.find(task => task.id === editor.id)!.dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed') ? `尚未完成：${team.tasks.find(task => task.id === editor.id)!.dependencies.filter(id => team.tasks.find(task => task.id === id)?.status !== 'completed').map(id => team.tasks.find(task => task.id === id)?.subject ?? id).join('、')}` : '上游已完成，确认后使用最新结果。'}</p>}
        {feedback && <p role="status">{feedback}</p>}<p className={css.hint}>属性需点击保存；草稿保存在此标签页，刷新可恢复。Esc 退出编辑并保留草稿。</p>{draftStale && <p role="alert">当前对象已变化，草稿仍保留。<button type="button" onClick={() => { if(draftId) updateView(current=>{const drafts={...current.drafts};delete drafts[draftId];return {...current,drafts}}) }}>重新载入</button></p>}
        <footer><button className={css.primary} disabled={working || (terminalEdit && team.phase === 'staged')}>{terminalEdit ? '保存并重跑此任务' : activeTask?.workflowConfigPending && editor.type !== 'member' ? '保存并完成配置' : '保存'}</button>
          {editor.type === 'member' && editor.id && rerunnableTasks(team.tasks,editor.id).some(task=>task.id===draft['rerunTaskId']) && <button type="submit" data-rerun="true" disabled={working}>保存并仅重跑所选任务</button>}
          {editor.id && editor.type !== 'member' && !activeTask?.workflowConfigPending && team.tasks.find(task => task.id === editor.id)?.workflowPaused && <button type="submit" data-resume="true" disabled={working || (team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && team.tasks.find(task => task.id === editor.id)!.dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed'))}>保存并确认{editor.type === 'check' ? '重新验收' : '执行'}</button>}
          {editor.id && editor.type !== 'member' && !terminalEdit && <button type="button" disabled={working} onClick={() => void deleteNode(editor.id!)}>删除节点</button>}
          {editor.type === 'check' && editor.id && data.ready.includes(editor.id) && <button type="button" disabled={working} onClick={() => void openReview(editor.id!)}>开始验收 ↗</button>}<button type="button" onClick={cancelEdit}>放弃修改</button>
          {editor.type === 'member' && editor.id && <button type="button" disabled={working} onClick={() => void saveEdit([{ action: 'remove_member', name: editor.id! }], `移除 ${editor.id}`, true)}>移除成员</button>}</footer>
      </form>}
        </section>
      </div>}
    </section>, document.body)}
  </>
}
