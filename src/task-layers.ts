/** Portable task contracts shared by the browser, persistence and execution. */
export interface TaskBrief { requirements: string; deliverables: string; acceptance: string }
export interface TaskLayers { general: TaskBrief; specific: TaskBrief }
export function taskNeedsConfiguration(task:{workflowConfigPending?:boolean;adaptationIssue?:string;layers?:TaskLayers;specificContractVersion?:number}):boolean {
  return !!task.workflowConfigPending || !!task.adaptationIssue?.trim() || !!task.layers && (task.specificContractVersion !== 1 || !task.layers.general.requirements.trim() || !task.layers.specific.requirements.trim())
}
export const emptyBrief = (): TaskBrief => ({ requirements: '', deliverables: '', acceptance: '' })
export function isTaskBrief(value: unknown): value is TaskBrief {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return ['requirements','deliverables','acceptance'].every(key => typeof v[key] === 'string' && v[key].length <= 16000)
}
export function isTaskLayers(value: unknown): value is TaskLayers {
  const v = value as TaskLayers | undefined
  return !!v && isTaskBrief(v.general) && isTaskBrief(v.specific)
}
export function parseBrief(value: unknown): TaskBrief {
  if (!isTaskBrief(value)) throw new Error('任务层需要任务要求、交付物和验收要求三个文本字段（每项最多 16000 字）')
  return { requirements: value.requirements.trim(), deliverables: value.deliverables.trim(), acceptance: value.acceptance.trim() }
}
export function parseLayers(value: unknown): TaskLayers {
  if (!isTaskLayers(value)) throw new Error('通用任务和本次任务格式无效')
  return { general: parseBrief(value.general), specific: parseBrief(value.specific) }
}
export function briefText(value: TaskBrief): string {
  return [value.requirements, value.deliverables && `交付物：\n${value.deliverables}`, value.acceptance && `验收要求：\n${value.acceptance}`].filter(Boolean).join('\n\n')
}
export function taskText(task: { description?: string; layers?: TaskLayers }): string {
  return task.layers ? briefText(task.layers.specific) : task.description ?? ''
}
export function layersFromDraft(draft: Record<string,string>): TaskLayers {
  return {general:{requirements:draft['generalRequirements'] ?? '',deliverables:draft['generalDeliverables'] ?? '',acceptance:draft['generalAcceptance'] ?? ''},
    specific:{requirements:draft['description'] ?? '',deliverables:draft['specificDeliverables'] ?? '',acceptance:draft['specificAcceptance'] ?? ''}}
}

/** New model-authored nodes must contain a reusable and an instance contract. */
export function requireGeneratedTaskLayers(operations:import('./workflow-types.ts').WorkflowOperation[]):void {
  for(const op of operations)if(op.action==='add_task'){
    if(!op.layers || !op.layers.general.requirements.trim() || !op.layers.specific.requirements.trim())throw new Error('新建任务必须提供 layers.general 和 layers.specific，各含 requirements、deliverables、acceptance 三个字符串；两层 requirements 均不能为空。不要将分层标题写入 description。')
  }
}
const briefParameter = {type:'object',additionalProperties:false,properties:{requirements:{type:'string',required:true},deliverables:{type:'string',required:true},acceptance:{type:'string',required:true}}} as const
export const taskLayersParameter = {type:'object',description:'Generate both layers when creating tasks: general is the reusable method and quality constraints; specific is the COMPLETE standalone execution contract, concretizing every general method, deliverable and acceptance constraint for the current goal, paths and parameters. Executors see only specific, never general; do not use references such as follow the general requirements. Each has requirements, deliverables, acceptance strings. Do not duplicate layers in description.',additionalProperties:false,properties:{general:{...briefParameter,required:true},specific:{...briefParameter,required:true}}} as const
