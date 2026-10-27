/** Editable human approval, shared by the workbench and discussion sidebar. */
import { useState } from 'react'
import type { TeamState } from '../types.ts'
import type { WorkflowOperation, WorkflowProposal } from '../workflow-types.ts'
import { lineDiff, reviewedOperations, reviewFields, setReviewField } from './proposal-review.ts'
import css from './ProposalReview.module.css'

export type ProposalReviewDraft = { operations: WorkflowOperation[]; included: boolean[] }
export function ProposalReview({ team, proposal, base, busy, onApply, onDismiss, draft, onChange }: {
  team: TeamState; proposal: WorkflowProposal; base: string; busy: boolean;
  onApply: (operations: WorkflowOperation[]) => void; onDismiss: () => void;
  draft?: ProposalReviewDraft; onChange: (draft: ProposalReviewDraft) => void;
}) {
  const [original] = useState(() => structuredClone(team))
  const operations = draft?.operations ?? proposal.operations
  const included = draft?.included ?? proposal.operations.map(() => true)
  const effective = reviewedOperations(original, operations, included)
  const stale = base !== proposal.base
  const edited = JSON.stringify(operations) !== JSON.stringify(proposal.operations) || included.some(value => !value)
  return <section className={css.review} aria-label="审批修改对照">
    <header><strong>{proposal.title}</strong><p>绿色 + 新增 · 红色 − 删除 · = 相同。可直接编辑「之后」，确认后生效。</p></header>
    <div className={css.actions}><button type="button" className={css.apply} disabled={busy || stale || effective.length === 0} onClick={() => onApply(effective)}>{edited ? '确认应用编辑后的内容' : '确认应用'}</button><button type="button" disabled={busy} onClick={onDismiss}>放弃修改</button>{edited && <button type="button" disabled={busy} onClick={() => onChange({ operations: structuredClone(proposal.operations), included: proposal.operations.map(() => true) })}>恢复 AI 建议</button>}</div>
    {stale && <p role="alert">团队已变化，此提案已过期。请与 AI 重新确认，避免覆盖新结果。</p>}
    {!effective.length && <p role="status">当前没有要应用的改动，可以继续编辑或放弃修改。</p>}
    {operations.map((operation, index) => {
      const comparison = reviewFields(original, operation)
      return <article key={index} className={css.operation} data-included={included[index]}><label className={css.include}><input type="checkbox" checked={included[index]} disabled={busy} onChange={event => onChange({ operations, included: included.map((value, i) => i === index ? event.target.checked : value) })} />应用此项 · {comparison.title}</label>
        {comparison.fields.map(field => {
          const same = field.before === field.after
          return <section key={field.key} className={css.field} data-change={same ? 'same' : !field.before ? 'added' : !field.after ? 'removed' : 'changed'}><div className={css.fieldHeading}><strong>{field.label}</strong><span>{same ? '= 相同' : !field.before ? '+ 新增' : !field.after ? '− 删除' : '± 修改'}</span></div>
            <div className={css.pair}><div><span className={css.caption}>之前</span><pre>{field.before || '（空）'}</pre></div><label><span className={css.caption}>之后{field.editable ? ' · 可编辑' : ''}</span>{field.editable ? <textarea aria-label={`${comparison.title} · ${field.label} · 之后`} rows={Math.min(9, Math.max(2, field.after.split('\n').length))} value={field.after} disabled={busy || !included[index]} onChange={event => onChange({ included, operations: operations.map((op, i) => i === index ? setReviewField(op, field, event.target.value) : op) })} /> : <pre>（删除该对象）</pre>}</label></div>
            {!same && <details open><summary>逐行差异</summary><div className={css.diff}>{lineDiff(field.before, field.after).map((line, i) => <div key={i} data-kind={line.kind}><span aria-label={line.kind === 'same' ? '相同' : line.kind === 'added' ? '新增' : '删除'}>{line.kind === 'same' ? '=' : line.kind === 'added' ? '+' : '−'}</span><code>{line.text || ' '}</code></div>)}</div></details>}
          </section>
        })}
      </article>
    })}
  </section>
}
