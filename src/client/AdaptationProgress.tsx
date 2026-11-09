import { BrandIcon } from './BrandIcon.tsx'
import { adaptationLabels, type AdaptationPhase } from './adaptation-progress.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import css from './WorkflowWorkbench.module.css'

export function AdaptationProgress({ phase, disabled, onOpen }: { phase: AdaptationPhase; disabled?: boolean; onOpen: () => void }) {
  const l = useWorkflowText(), labels = adaptationLabels[phase]
  const busy = phase === 'connecting' || phase === 'generating'
  return <section className={css.adaptationProgress} data-adaptation-state={phase} aria-label={l('本次任务适配')}>
    <button type="button" disabled={disabled} onClick={onOpen}><span className={busy ? css.adaptationSpinner : undefined} aria-hidden="true"><BrandIcon /></span>{l(labels.button)}</button>
    <p role="status" aria-live="polite">{l(labels.detail)}</p>
  </section>
}
