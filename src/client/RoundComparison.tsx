import type { TeamTask } from '../types.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import css from './LoopPanel.module.css'

type Result = Pick<TeamTask, 'id' | 'subject' | 'status' | 'output'> & Required<Pick<TeamTask, 'acceptanceResults' | 'commandsRun'>>
export interface RoundResults {
  round: number
  tasks: Result[]
  executionRounds?: Record<string, number>
  previous?: { round: number; tasks: Result[] }
}

function Evidence({ result }: { result: Result }) {
  const { language } = useWorkflowText()
  return <div>
    <pre>{result.output || '—'}</pre>
    {[...result.acceptanceResults, ...result.commandsRun].map((item, index) =>
      <p key={index}><strong>{item.status === 'passed' ? (language === 'en' ? 'Passed' : '通过') : (language === 'en' ? 'Failed' : '失败')}</strong>
        {' · '}{'command' in item ? <code>{item.command}</code> : item.criterion}
        {'exitCode' in item && item.exitCode != null && ' (' + item.exitCode + ')'}{item.evidence && <span> · {item.evidence}</span>}</p>)}
  </div>
}

export function RoundComparison({ round, tasks, previous, executionRounds }: RoundResults) {
  const { language } = useWorkflowText()
  const tr = (zh: string, en: string) => language === 'en' ? en : zh
  const rows = tasks.map(task => {
    const prior = previous?.tasks.find(item => item.id === task.id)
    const executed = executionRounds?.[task.id]
    const reused = executed !== undefined && executed < round && ['completed', 'failed'].includes(task.status)
    const changed = !!prior && JSON.stringify(prior.acceptanceResults) !== JSON.stringify(task.acceptanceResults)
    const failed = [...task.commandsRun, ...task.acceptanceResults].some(item => item.status === 'failed') || task.status === 'failed'
    const rerun = round > 1 && executed === round
    return { task, prior, executed, reused, changed, failed, rerun, priority: Number(failed) * 4 + Number(changed) * 2 + Number(rerun) }
  }).sort((a, b) => b.priority - a.priority)
  return <>{rows.map(({ task, prior, executed, reused, changed, failed, rerun, priority }) =>
    <details key={task.id} open={priority > 0 || undefined}>
      <summary>{task.subject} · {task.status}
        {reused && ' · ' + tr('沿用第 ' + executed + ' 轮', 'Reused from round ' + executed)}
        {rerun && ' · ' + tr('本轮执行', 'Executed this round')}
        {changed && ' · ' + tr('验收结果有变化', 'Acceptance changed')}
        {failed && ' · ' + tr('有失败记录', 'Failure reported')}</summary>
      <div className={css.comparison}>
        {prior && previous && <section><strong>{tr('上轮', 'Previous round')} {previous.round} · {prior.status}</strong><Evidence result={prior}/></section>}
        <section><strong>{tr('本轮', 'Current round')} {round}</strong><Evidence result={task}/></section>
      </div>
    </details>)}</>
}
