/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TeamState, TeamTask } from '../types.ts'
import type { WorkflowOperation } from '../workflow-types.ts'
import css from './WorkflowWorkbench.module.css'
import { WorkflowContext } from './WorkflowContext.tsx'
import { taskDraftOperations } from './workflow-draft.ts'
import { connectionIssue, connectionTarget } from './workflow-connections.ts'
import { LEAD_ART, REVIEW_ART, memberArtUrl } from './artwork.ts'

interface Response { team: TeamState; ready: string[]; busy: string[]; openedSessionId?: string; currentDiscussion?: string }
async function request(payload: Record<string, unknown>): Promise<Response | undefined> {
  const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const result = await response.json() as Response & { error?: string }
  if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`)
  if (!result.team) return
  return result
}
const taskStatus = (task: TeamTask, ready: string[]): string => task.workflowPaused ? '已暂停 · 可编辑'
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

function describeOperation(op: WorkflowOperation, team: TeamState, operations: WorkflowOperation[] = []): string {
  const taskName = (id: string) => {
    const added = operations.find(item => item.action === 'add_task' && item.id === id)
    return added?.action === 'add_task' ? added.subject : team.tasks.find(t => t.id === id)?.subject ?? id
  }
  const value = (v: unknown) => Array.isArray(v) ? v.map(id => taskName(String(id))).join('、') || '无' : String(v || '未设置')
  if (op.action === 'add_member') return `新增成员「${op.name}」\n职责概述：${op.summary}\n长期职责：${op.role || '未设置'}\n执行指令：${op.executionPrompt || '未设置'}`
  if (op.action === 'remove_member') return `移除成员「${op.name}」`
  if (op.action === 'remove_task') return `删除节点「${taskName(op.id)}」`
  if (op.action === 'rework') return `为「${taskName(op.id)}」创建新一轮返工\n返工任务：${op.taskIds.map(taskName).join('、')}\n要求：${op.instructions}\n依赖这些结果的中间步骤也会重新执行，旧结果保留。`
  if (op.action === 'add_task') return `新增${op.checkpoint ? '人工检查' : '任务'}「${op.subject}」\n说明：${op.description || '未设置'}\n负责人：${op.checkpoint ? '你与独立验收 Agent' : op.assignee || '自动分配'}\n前置任务：${value(op.dependencies)}`
  const before = op.action === 'update_member' ? team.members.find(m => m.name === op.name) : team.tasks.find(t => t.id === op.id)
  const labels: Record<string, string> = { summary: '职责概述', role: '长期职责', executionPrompt: '执行指令', subject: '任务名称', description: '任务说明', assignee: '负责人', dependencies: '前置任务' }
  return `修改「${op.action === 'update_member' ? op.name : taskName(op.id)}」\n` + Object.entries(op).filter(([key]) => key in labels).map(([key, v]) => `${labels[key]}：${value((before as unknown as Record<string, unknown>)?.[key])}\n→ ${value(v)}`).join('\n')
}

export function WorkflowWorkbench({ sessionId, teamId, waitingCount = 0, openExecution, openConversation, nativeOnly = false, embeddedContext = false, onNativeContext, openContext }: {
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
  const [discussion, setDiscussion] = useState('graph')
  const [selectedTask, setSelectedTask] = useState<string>()
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [note, setNote] = useState('')
  const [pane, setPane] = useState<'members' | 'flow' | 'discussion'>('flow')
  const [name, setName] = useState('新团队')
  const [goal, setGoal] = useState('')
  const [editor, setEditor] = useState<{ type: 'member' | 'task' | 'check'; id?: string }>()
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [dependencies, setDependencies] = useState<string[]>([])
  const [successors, setSuccessors] = useState<string[]>([])
  const [picking, setPicking] = useState<'upstream' | 'downstream'>('upstream')
  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [link, setLink] = useState<{ from: string; x: number; y: number; to?: string; issue?: string }>()
  const cancelLink = useRef<(() => void) | undefined>(undefined)
  const canvas = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLElement>(null)
  const mounted = useRef(true)
  const generation = useRef(0)
  const team = data?.team
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
  useEffect(() => { if (!editor) return; const frame = requestAnimationFrame(() => fitCanvas()); return () => cancelAnimationFrame(frame) }, [editor?.type, editor?.id])
  const selectDiscussion = (key: string) => { setDiscussion(key); setPane('discussion') }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!opened) return
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLElement>('button, input')?.focus()
    return () => previous?.focus()
  }, [opened])
  useEffect(() => {
    if (editor) dialog.current?.querySelector<HTMLElement>('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus()
  }, [editor])
  useEffect(() => { if (teamId && teamId !== activeId) { setActiveId(teamId); setData(undefined); setDiscussion('graph'); setPositions({}); setSelectedTask(undefined); setEditor(undefined); generation.current++ } }, [sessionId, teamId])
  const refresh = async (): Promise<void> => {
    const token = generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, action: 'state' })
      if (!result) return
      if (mounted.current && token === generation.current) {
        setData(result); setActiveId(result.team.id)
        if (!data && result.currentDiscussion) { setDiscussion(result.currentDiscussion); setPane('discussion') }
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
    setError(''); const token = ++generation.current
    try {
      const result = await request({ sessionId, teamId: activeId, discussion, action, ...fields })
      if (!result) return
      if (mounted.current && token === generation.current) { setData(result); setActiveId(result.team.id) }
      return result
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : String(err)); return undefined }
    finally { if (mounted.current) { setWorking(false) } }
  }
  async function openDiscussion(key = discussion, targetId = activeId): Promise<void> {
    selectDiscussion(key)
    if (!openConversation) { setError('请在 DSH 中打开原生对话；开发预览不连接模型。'); return }
    const result = await perform('open_discussion', { discussion: key, teamId: targetId })
    if (result?.openedSessionId) {
      try { await openConversation(result.openedSessionId); setOpened(false); openContext?.() }
      catch (error) { setError(String(error)) }
    }
  }
  async function createFlow(): Promise<void> {
    const created = await perform('create', { name, description: goal })
    if (created) await openDiscussion('graph', created.team.id)
  }
  async function preview(operations: WorkflowOperation[], title: string): Promise<void> {
    if (await perform('preview', { operations, title, discussion: 'graph' })) { setEditor(undefined); selectDiscussion('graph') }
  }
  function edit(type: 'member' | 'task' | 'check', id?: string, after?: string): void {
    setEditor({ type, id }); setPane('flow'); setError(''); setPicking('upstream')
    const m = team?.members.find(item => item.name === id), t = team?.tasks.find(item => item.id === id)
    setDraft(type === 'member' ? { name: m?.name ?? '', summary: m?.summary ?? m?.role ?? '', role: m?.role ?? '', executionPrompt: m?.executionPrompt ?? '' }
      : { subject: t?.subject ?? '', description: t?.description ?? '', assignee: t?.assignee ?? '' })
    setDependencies(t?.dependencies ?? (after ? [after] : []))
    setSuccessors(id ? team?.tasks.filter(t => t.dependencies.includes(id)).map(t => t.id) ?? [] : after ? team?.tasks.filter(t => t.dependencies.includes(after) && t.status === 'pending' && (t.attempt ?? 0) === 0 && !t.checkpoint?.decision).map(t => t.id) ?? [] : [])
  }
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
    x: dependencies.length ? Math.max(...dependencies.map(id => pos(id).x)) + 270 : 32,
    y: dependencies.length ? Math.max(...dependencies.map(id => pos(id).y)) + 160 : Math.max(-128, ...team?.tasks.map(t => pos(t.id).y) ?? []) + 160,
  }
  const graphWidth = Math.max(580, ...team?.tasks.map(t => pos(t.id).x + 265) ?? [], taskEditing ? draftPosition.x + 265 : 0)
  const graphHeight = Math.max(260, ...team?.tasks.map(t => pos(t.id).y + 170) ?? [], taskEditing ? draftPosition.y + 170 : 0)
  function fitCanvas(): void {
    if (!canvas.current) return
    setZoom(Math.max(.45, Math.min(1, (canvas.current.clientWidth - 20) / graphWidth)))
  }
  function pickTask(id: string): void {
    if (!editor || !team || editor.type === 'member') return
    const chosen = picking === 'upstream' ? dependencies : successors
    if (chosen.includes(id)) {
      if (picking === 'upstream') setDependencies(chosen.filter(value => value !== id))
      else setSuccessors(chosen.filter(value => value !== id))
      return
    }
    if (id === editor.id || (picking === 'upstream' ? successors : dependencies).includes(id)) { setError('同一节点不能同时作为上游和后续，也不能连接自身'); return }
    const task = team.tasks.find(t => t.id === id)!
    if (picking === 'downstream' && (task.status !== 'pending' || (task.attempt ?? 0) > 0 || task.checkpoint?.decision || task.reassigning)) { setError('后续任务已经开始，请先停止任务，或通过返工建立新轮次'); return }
    if (editor.id) {
      const issue = picking === 'upstream' ? connectionIssue(team.tasks, id, editor.id) : connectionIssue(team.tasks, editor.id, id)
      if (issue && !issue.includes('已存在')) { setError(issue); return }
    }
    setError('')
    if (picking === 'upstream') setDependencies([...chosen, id]); else setSuccessors([...chosen, id])
  }
  async function openReview(id: string): Promise<void> {
    selectDiscussion(`check:${id}`); setSelectedTask(id)
    if (await perform('materials', { discussion: `check:${id}` })) await openDiscussion(`check:${id}`)
  }
  const pendingCount = Object.values(team?.workflow?.discussions ?? {}).filter(item => item.proposal?.status === 'pending').length
  const reviewCount = data?.ready.length ?? waitingCount
  if (nativeOnly && !data?.currentDiscussion) return null
  return <>
    {data?.currentDiscussion && team && <div className={css.nativeBanner}><span>{data.currentDiscussion.startsWith('check:') ? '独立验收对话' : '独立配置对话'} · {team.name}</span><button className={css.entry} onClick={() => void openExecution?.(team.captainSessionId, team.captainSessionId)}>返回队长对话 ↗</button></div>}
    <button type="button" className={`${css.entry} ${nativeOnly ? css.compact : css.launcher}`} aria-haspopup="dialog" onClick={() => setOpened(true)}>
      <strong>团队与流程 <span aria-hidden>↗</span></strong>
      {!nativeOnly && <span>{team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队')}</span>}
      {pendingCount > 0 && <span>{pendingCount} 项修改待确认</span>}
      {reviewCount > 0 && <span>{reviewCount} 项等待人工验收</span>}
    </button>
    {nativeOnly && data?.currentDiscussion && openContext && <button className={`${css.entry} ${css.compact}`} onClick={openContext}>讨论资料 ↗</button>}
    {embeddedContext && team && <section className={css.contextPanel} aria-label="讨论资料"><header><strong>讨论资料</strong><span>当前已保存的信息</span></header><label>查看对象<select value={discussion} onChange={event => setDiscussion(event.target.value)}><option value="graph">团队与流程</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name} value={`member:${m.name}`}>{m.name}</option>)}{team.tasks.filter(t => t.checkpoint).map(t => <option key={t.id} value={`check:${t.id}`}>验收 · {t.subject}</option>)}</select></label><WorkflowContext team={team} discussion={discussion} onSelect={setDiscussion} openExecution={openExecution} />
      {conversation?.materials && <details><summary>本轮验收证据</summary><ReviewMaterials text={conversation.materials} /></details>}
      {proposal && <section className={css.contextProposal}><strong>待确认 · {proposal.title}</strong>{proposal.operations.map((op, i) => <pre key={i}>{describeOperation(op, team, proposal.operations)}</pre>)}<button onClick={() => { setPane('discussion'); setOpened(true) }}>在画布查看并确认</button></section>}
    </section>}
    {opened && createPortal(<section ref={dialog} className={css.workbench} data-editing={!!editor} role="dialog" aria-modal="true" aria-label="TeamFlow 编排工作台" onKeyDown={event => {
      if (event.key === 'Escape') { if (cancelLink.current) { cancelLink.current(); return }; if (editor) setEditor(undefined); else setOpened(false) }
      if (event.key === 'Tab') {
        const scope = dialog.current
        const items = [...scope?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary') ?? []].filter(el => el.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }}>
      <header className={css.header}><div className={css.title}><img src={LEAD_ART} alt="" /><div><strong>{team?.name ?? '创建团队'}</strong><span>{team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台'}</span></div></div>
        <div>{team?.phase === 'staged' && <button className={css.primary} disabled={working} onClick={() => void perform('start')}>确认并启动</button>}
          <button onClick={() => setOpened(false)} aria-label="关闭编排工作台">关闭</button></div></header>
      {team && <nav className={css.paneTabs} aria-label="工作台视图">{(['members', 'flow', 'discussion'] as const).map(value => <button key={value} aria-pressed={pane === value} onClick={() => setPane(value)}>{value === 'members' ? `成员 ${team.members.filter(m => m.status !== 'removed').length}` : value === 'flow' ? '任务流程' : '修改与验收'}{value === 'discussion' && proposal && <i aria-label="有待确认的修改" />}</button>)}</nav>}
      {error && <div className={css.error} role="alert">{error}</div>}
      {!activeId ? <form className={css.create} onSubmit={e => { e.preventDefault(); void createFlow() }}>
        <h2>描述目标，一起规划团队</h2><label>团队名称<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>团队目标<textarea required value={goal} onChange={e => setGoal(e.target.value)} /></label><button className={css.primary} disabled={working}>在 DSH 中讨论方案 ↗</button>
      </form> : !team ? <p role="status">正在读取团队…</p> : <div className={css.columns} data-pane={pane} data-editing={!!editor}>
        <aside className={css.roster}><h3>成员 <button aria-label="添加成员" disabled={working || !!editor} onClick={() => edit('member')}>＋ 添加</button></h3>
          {team.members.filter(m => m.status !== 'removed').map(m => <article key={m.name} className={discussion === `member:${m.name}` ? css.selected : ''}>
            <button className={css.member} onClick={() => { selectDiscussion(`member:${m.name}`); setSelectedTask(undefined) }}><img src={memberArtUrl(m.name, m.role ?? '')} alt="" /><span><strong>{m.name}</strong><span>{m.summary || m.role || '尚未填写职责概述'}</span></span></button>
            <small>{m.model || '继承队长模型'}</small><div><button disabled={working || !!editor} onClick={() => edit('member', m.name)}>编辑职责</button><button disabled={working} onClick={() => void openDiscussion(`member:${m.name}`)}>讨论调整 ↗</button>
              {m.id && openExecution && <button onClick={() => { openExecution(m.id, team.captainSessionId); setOpened(false) }}>执行对话 ↗</button>}
              {openExecution && m.previousSessionIds?.map((id, i) => <button key={id} onClick={() => { openExecution(id, team.captainSessionId); setOpened(false) }}>历史执行 {i + 1} ↗</button>)}</div>
          </article>)}
          <p className={css.hint}>点击成员查看职责，讨论调整会打开 DSH 原生对话。确认修改后生效。</p>
        </aside>
        <main className={css.graphArea}>
          <nav className={css.toolbar}><button className={css.primary} disabled={working || !!editor} onClick={() => void openDiscussion('graph')}>讨论流程 ↗</button><button disabled={working || !!editor} onClick={() => edit('task')}>＋ 任务</button><button disabled={working || !!editor} onClick={() => edit('check')}>＋ 人工检查</button><button aria-label="缩小画布" onClick={() => setZoom(value => Math.max(.45, value - .1))}>−</button><button aria-label="放大画布" onClick={() => setZoom(value => Math.min(1.5, value + .1))}>＋</button><button onClick={fitCanvas}>适应画布</button><span role={link || taskEditing ? 'status' : undefined}>{taskEditing ? `点击画布节点选择${picking === 'upstream' ? '上游' : '后续'} · 虚线表示尚未应用的修改` : link ? link.issue ?? (link.to ? '已吸附到输入端 · 松开查看交接预览' : '靠近下一节点以连接 · Esc 取消') : '拖动节点；从右侧端口拉线到下一节点，上游完成后下游开始'}</span></nav>
          {!editor && !!data?.ready.length && <div className={css.notice} role="status">等待人工验收：{data.ready.map(id => <button key={id} disabled={working} onClick={() => void openReview(id)}>{team.tasks.find(t => t.id === id)?.subject} →</button>)}</div>}
          <div className={css.canvas} ref={canvas}>
            <div className={css.plane} style={{ width: graphWidth, height: graphHeight, zoom }}>
              <svg className={css.edges} aria-hidden="true"><defs><marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor" /></marker></defs>
                {team.tasks.flatMap(t => t.dependencies.filter(dep => !(taskEditing && (t.id === editor?.id || dep === editor?.id || (successors.includes(t.id) && dependencies.includes(dep))))).map(dep => { const a = pos(dep), b = pos(t.id); return <path key={`${dep}-${t.id}`} d={`M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`} markerEnd="url(#workflow-arrow)" /> }))}
                {taskEditing && <g className={css.draftEdges}>{dependencies.map(id => { const a = pos(id), b = draftPosition; return <path key={id} d={`M${a.x + 225},${a.y + 55} C${a.x + 265},${a.y + 55} ${b.x - 40},${b.y + 55} ${b.x},${b.y + 55}`} markerEnd="url(#workflow-arrow)" /> })}{successors.map(id => { const a = draftPosition, b = pos(id); return <path key={id} d={`M${a.x + 225},${a.y + 55} C${a.x + 265},${a.y + 55} ${b.x - 40},${b.y + 55} ${b.x},${b.y + 55}`} markerEnd="url(#workflow-arrow)" /> })}</g>}
                {link && <path d={`M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}`} />}
              </svg>
              {team.tasks.map(task => { const p = pos(task.id); return <article key={task.id} data-selection={taskEditing ? dependencies.includes(task.id) ? 'upstream' : successors.includes(task.id) ? 'downstream' : undefined : undefined} data-connection={link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined} className={`${css.node} ${task.checkpoint ? css.checkpoint : ''} ${selectedTask === task.id ? css.selected : ''}`} style={{ left: p.x, top: p.y }}>
                <div className={css.drag} onPointerDown={event => {
                  if (event.button !== 0 || working || editor) return
                  event.currentTarget.setPointerCapture(event.pointerId)
                  const start = point(event), original = pos(task.id); let last = original
                  const target = event.currentTarget
                  target.onpointermove = move => { const at = point(move); last = { x: Math.min(10000, Math.max(0, original.x + at.x - start.x)), y: Math.min(10000, Math.max(0, original.y + at.y - start.y)) }; setPositions(prev => ({ ...prev, [task.id]: last })) }
                  target.onpointerup = () => { target.onpointermove = null; target.onpointerup = null; void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next })) }
                  target.onpointercancel = () => { target.onpointermove = null; target.onpointerup = null; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next }) }
                }}>⠿ {task.checkpoint ? '人工检查' : '执行任务'} · {task.id}</div>
                <button className={css.nodeBody} aria-pressed={taskEditing ? (picking === 'upstream' ? dependencies : successors).includes(task.id) : undefined} onClick={() => { if (taskEditing) { pickTask(task.id); return }; setSelectedTask(task.id); if (task.checkpoint && (data.ready.includes(task.id) || task.checkpoint.decision === 'reject')) void openReview(task.id) }}>
                  <strong>{task.subject}</strong>{taskEditing && <small>{dependencies.includes(task.id) ? '✓ 已选上游' : successors.includes(task.id) ? '✓ 已选后续' : task.id === editor?.id ? '正在编辑此节点' : `点击选择${picking === 'upstream' ? '上游' : '后续'}`}</small>}<span className={css.taskOwner}><img src={task.checkpoint ? REVIEW_ART : memberArtUrl(task.assignee ?? '', team.members.find(m => m.name === task.assignee)?.role ?? '')} alt="" />{task.checkpoint ? '验收 Agent 与你' : task.assignee || '自动分配成员'}</span><small data-ready={data.ready.includes(task.id)}>{taskStatus(task, data.ready)}</small></button>
                <button className={`${css.port} ${css.input}`} data-input-id={task.id} aria-label={`${task.subject} 输入端`} />
                <button className={`${css.port} ${css.output}`} aria-label={`${task.subject} 输出端`} disabled={working || !!editor} onPointerDown={event => {
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
                    if (to && !issue) void preview([{ action: 'update_task', id: to.id, dependencies: [...to.dependencies, task.id] }], `连接 ${task.subject} → ${to.subject}`)
                  }
                  target.onpointercancel = cleanup
                }} />
              </article> })}
              {taskEditing && !editor?.id && <article className={`${css.node} ${css.draftNode}`} style={{ left: draftPosition.x, top: draftPosition.y }}><div className={css.drag}>草稿 · 确认后加入流程</div><div className={css.nodeBody}><strong>{draft['subject'] || (editor?.type === 'check' ? '新人工检查' : '新任务')}</strong><span>{editor?.type === 'check' ? '你与独立验收 Agent' : draft['assignee'] || '待指定 Agent'}</span><small>尚未应用</small></div></article>}
              {!team.tasks.length && !editor && <p className={css.empty}>添加任务或人工检查，或让 AI 根据目标提出流程方案。</p>}
            </div>
          </div>
          {activeTask && !editor && <section className={css.details}><strong>{activeTask.subject}</strong><p>{activeTask.description || '暂无任务说明'}</p><div>
            <button disabled={working || activeTask.status !== 'pending' || (activeTask.attempt ?? 0) > 0 || !!activeTask.checkpoint?.decision} onClick={() => edit(activeTask.checkpoint ? 'check' : 'task', activeTask.id)}>编辑任务与连接</button>
            {!activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && <button disabled={working} onClick={() => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id })}>{activeTask.workflowPaused ? '继续执行' : '停止任务以编辑'}</button>}
            <button disabled={working || !!editor} onClick={() => edit('check', undefined, activeTask.id)}>在此之后插入人工检查</button><button className={css.danger} disabled={working || activeTask.status !== 'pending' || (activeTask.attempt ?? 0) > 0 || !!activeTask.checkpoint?.decision || team.tasks.some(t => t.dependencies.includes(activeTask.id))} onClick={() => void preview([{ action: 'remove_task', id: activeTask.id }], `删除 ${activeTask.subject}`)}>删除节点</button>
          </div></section>}
        </main>
        <aside className={css.discussion}><header><img src={reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART} alt="" /><div><h3>{reviewTask ? `验收 · ${reviewTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改'}</h3>
          <small>{reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效'}</small></div></header>
          <div className={css.messages}>
            <p className={css.hint}>{reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : member ? '与独立配置顾问讨论职责、Summary、执行指令和任务。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。'}</p>
            <button className={css.primary} disabled={working} onClick={() => void openDiscussion()}>在 DSH 中{conversation?.native ? '继续' : '开始'}讨论 ↗</button>
            <WorkflowContext team={team} discussion={discussion} onSelect={selectDiscussion} openExecution={openExecution} />
            {conversation?.materials && <details open><summary>本轮验收材料与证据</summary><ReviewMaterials text={conversation.materials} /></details>}
            {data.busy.includes(discussion) && <p role="status">原生对话正在整理方案…</p>}
          </div>
          {proposal && <section className={css.proposal}><strong>{proposal.title}</strong><details open><summary>修改预览（不会立即执行）</summary>{proposal.operations.map((op, i) => <pre key={i}>{describeOperation(op, team, proposal.operations)}</pre>)}</details>
            <button className={css.primary} disabled={working} onClick={() => void perform('apply', { proposalId: proposal.id })}>确认应用</button><button disabled={working} onClick={() => void perform('dismiss')}>放弃提案</button></section>}
          {reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && <div className={css.decisions}>
            <button className={css.primary} disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok) setNote('') })}>通过验收</button>
            <button disabled={working} onClick={() => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) { setNote(''); void openDiscussion() } })}>退回并讨论返工</button>
          </div>}
          {reviewTask?.checkpoint?.decision === 'reject' && <p className={css.notice}>已拒绝，下游保持等待。请讨论返工对象并确认新方案。</p>}
          {reviewTask && <div className={css.composer}><label>验收意见（随决定保存）<textarea aria-label="验收意见" value={note} onChange={e => setNote(e.target.value)} placeholder="记录通过或退回的原因…" /></label><button disabled={working || !data.ready.includes(reviewTask.id)} onClick={() => void perform('materials')}>刷新验收材料</button></div>}
          {!data.currentDiscussion && <button disabled={working || data.busy.includes(discussion)} onClick={() => void perform('new_discussion').then(ok => { if (ok) void openDiscussion() })}>新建独立讨论</button>}
        </aside>
      {editor && <form data-workflow-editor className={css.editor} onSubmit={event => {
        event.preventDefault()
        try {
          const operations: WorkflowOperation[] = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'] } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'] }]
            : taskDraftOperations(team, { id: editor.id, checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: draft['assignee'], dependencies, successors })
          void preview(operations, editor.type === 'member' ? '调整团队成员' : '调整任务流程与交接')
        } catch (error) { setError(String(error)) }
      }}><h3>{editor.id ? '编辑' : '添加'}{editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务'}</h3>
        {editor.type === 'member' ? <>{field('name', '名称')}{field('summary', 'Summary · 功能概述', true)}{field('role', '长期职责', true)}{field('executionPrompt', '执行指令 / PE', true)}</>
          : <>{field('subject', '任务名称')}{field('description', '任务要求 / 验收要求', true)}{editor.type !== 'check' && <label>执行 Agent<select value={draft['assignee'] ?? ''} onChange={e => setDraft({ ...draft, assignee: e.target.value })}><option value="">由空闲成员领取</option>{team.members.filter(m => m.status !== 'removed').map(m => <option key={m.name}>{m.name}</option>)}</select></label>}
            <fieldset className={css.picker}><legend>在画布选择连接</legend><div className={css.pickerTabs}><button type="button" aria-pressed={picking === 'upstream'} onClick={() => setPicking('upstream')}>上游 · {dependencies.length}</button><button type="button" aria-pressed={picking === 'downstream'} onClick={() => setPicking('downstream')}>后续 · {successors.length}</button></div>
              <p>{picking === 'upstream' ? '哪些任务完成后，这个节点才能开始？' : '这个节点完成或验收通过后，哪些任务才能开始？'}</p>
              <div className={css.chips}>{(picking === 'upstream' ? dependencies : successors).map(id => <button type="button" key={id} onClick={() => pickTask(id)}>{team.tasks.find(t => t.id === id)?.subject ?? id} ×</button>)}</div>
              <details><summary>按名称选择</summary>{team.tasks.filter(t => t.id !== editor.id).map(t => <label key={t.id}><input type="checkbox" checked={(picking === 'upstream' ? dependencies : successors).includes(t.id)} onChange={() => pickTask(t.id)} />{t.subject}</label>)}</details>
              {!!successors.length && <p className={css.hint}>选中上游与后续之间的直接连线将改为经过本节点；后续的其他上游保持不变。</p>}
            </fieldset></>}
        <footer><button className={css.primary} disabled={working}>预览修改</button><button type="button" onClick={() => setEditor(undefined)}>取消</button>
          {editor.type === 'member' && editor.id && <button type="button" disabled={working} onClick={() => void preview([{ action: 'remove_member', name: editor.id! }], `移除 ${editor.id}`)}>移除成员</button>}</footer>
      </form>}
      </div>}
    </section>, document.body)}
  </>
}
