import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './WorkflowWorkbench.module.css'

/** History comes from activity snapshots, never from the mutable workflow API. */
export function WorkflowHistory({ name, children }: { name: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <>
    <button type="button" className={`${css.entry} ${css.launcher}`} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      <strong>团队与流程 <span aria-hidden>↗</span></strong><span>{name} · 历史记录，只读</span>
    </button>
    {createPortal(<dialog ref={dialog} className={`${css.entry} ${css.historyDialog}`} aria-label={`${name} · 团队与流程（只读）`}>
      <header><div><strong>{name}</strong><p>历史记录 · 只读</p></div><button type="button" autoFocus onClick={() => dialog.current?.close()}>关闭</button></header>
      {children}
    </dialog>, document.body)}
  </>
}
