import type { AgentTeamsTranslate } from './locales.ts'
import { zh } from './locales.ts'
import type { taskControlState } from './task-control.ts'
import css from './TaskStateBadge.module.css'

export const taskStateNodeClass = `${css.state} ${css.node}`
const symbols: Record<string,string> = {
  configurationPending:'✎',awaitingStart:'▷',staged:'▷',waiting:'⌛',blocked:'!',queued:'⋯',
  claimed:'◷',inProgress:'▶',stopping:'◷',paused:'Ⅱ',reviewReady:'◇',reviewRejected:'↩',
  reviewPassed:'✓',rerunRequired:'↻',rerunWaiting:'⌛',reviewRequired:'◇',completed:'✓',failed:'!',cancelled:'×',stopped:'■',notRun:'—',stale:'!',
}
export function TaskStateBadge({control,t,className='',detail,discarded=false,stale=false}: {
  control: ReturnType<typeof taskControlState>; t?:AgentTeamsTranslate; className?:string; detail?:string; discarded?:boolean; stale?:boolean
}) {
  const visual = discarded ? 'notRun' : stale ? 'stale' : control.visual
  const key = discarded ? 'task.status.notRun' : stale ? 'workspace.verdictStale' : control.label
  const label = t ? t(key) : zh[key]
  return <span className={`${css.state} ${css.badge} ${className}`} data-lifecycle={visual} title={detail || label}>
    <span aria-hidden="true" className={css.symbol}>{symbols[visual] ?? '•'}</span><span>{label}</span>
  </span>
}
