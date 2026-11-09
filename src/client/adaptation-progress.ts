import type { WorkflowProposal } from '../workflow-types.ts'

export type AdaptationPhase = 'idle' | 'connecting' | 'generating' | 'ready' | 'stale' | 'attention' | 'applied' | 'error' | 'disconnected'
/** Use observed host state; an idle AI without a proposal is not a successful adaptation. */
export function adaptationPhase(input: { opening: boolean; busy: boolean; disconnected: boolean; error: boolean; hasSession: boolean; proposal?: WorkflowProposal; base?: string }): AdaptationPhase {
  if (input.disconnected) return 'disconnected'
  if (input.opening) return 'connecting'
  if (input.busy) return 'generating'
  if (input.error && !input.hasSession) return 'error'
  if (input.proposal?.status === 'pending') return input.proposal.base === input.base ? 'ready' : 'stale'
  if (input.proposal?.status === 'applied') return 'applied'
  return input.hasSession ? 'attention' : 'idle'
}

export const adaptationLabels: Record<AdaptationPhase, { button: string; detail: string }> = {
  idle: { button: '统一适配本次任务', detail: 'AI 将生成本次任务方案，确认后才会生效。' },
  connecting: { button: '正在连接 AI… · 查看进度', detail: '正在打开适配讨论，请稍候。重复点击不会重新生成。' },
  generating: { button: '正在适配… · 查看进度', detail: 'AI 正在生成任务方案。可以浏览画布，切换面板不会中断生成；确认后才会生效。' },
  ready: { button: '方案已生成 · 待确认', detail: '请检查任务方案，确认后才会更新流程。' },
  stale: { button: '方案需要更新 · 查看讨论', detail: '流程已变化，请在原讨论中让 AI 更新方案。' },
  attention: { button: '适配待继续 · 查看回复', detail: 'AI 当前未在生成，请查看回复、补充信息或继续讨论。' },
  applied: { button: '方案已应用 · 查看讨论', detail: '本次适配方案已应用，可以继续查看讨论。' },
  error: { button: '连接未完成 · 重试打开', detail: '未能打开适配讨论，请查看错误并重试。' },
  disconnected: { button: '进度暂不可用 · 返回讨论', detail: '连接暂时中断，正在重新获取进度。生成是否完成尚未确认，请勿重复提交。' },
}

export const adaptationConflicts = new Set(['edit', 'layout', 'preview', 'apply', 'dismiss', 'start', 'template_apply'])
