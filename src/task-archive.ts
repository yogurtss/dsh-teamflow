import { createHash, randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import type { TeamState, TeamTask } from './types.ts'
import { readTeam, withTeamLock, writeTeam } from './state.ts'
import { checkpointInputs } from './workflow.ts'
import { taskNeedsConfiguration } from './task-description.ts'
import { parseTaskArchive, type TaskArchiveRecord } from './task-archive-config.ts'

const running = new Map<string, Promise<void>>()
const workers = new Map<string, {worker:Worker;taskId:string}>()
const keyOf = (root: string, team: string) => join(root, team)
function inputs(team: TeamState, task: TeamTask) {
  const tasks = checkpointInputs(team, task)
  const ids = new Set(tasks.map(t => t.id))
  return { tasks, loops: (team.workflow?.loops ?? []).filter(l => ids.has(l.gateId)).map(l => ({id:l.id,runId:l.runId,round:l.round,status:l.status,historyHead:l.historyHead,historyCount:l.historyCount})), config:parseTaskArchive(task.archive) }
}
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const eligible = (team: TeamState, task: TeamTask) => !team.halted && team.phase !== 'staged' && task.kind === 'archive' && !task.workflowPaused && !task.workflowRerunRequired && !taskNeedsConfiguration(task) && !task.reassigning && task.dependencies.every(id => team.tasks.some(t => t.id === id && t.status === 'completed'))

/** A worker owns file I/O; the host lock owns only claims and guarded state commits. */
export async function runTaskArchives(root: string, workspace: string, teamId: string): Promise<void> {
  const key = keyOf(root, teamId)
  if (running.has(key)) return running.get(key)
  const work = (async () => {
    for (;;) {
      const claim = await withTeamLock(`team:${root}:${teamId}`, async () => {
        const team = await readTeam(root,teamId)
        if (!team) return
        const task = team.tasks.find(t => eligible(team,t) && ['pending','in_progress'].includes(t.status))
        if (!task) return
        const source = inputs(team,task), id = randomUUID(), createdAt = Date.now()
        task.status='in_progress'; task.attempt=(task.attempt??0)+1; task.attemptId=id; task.updatedAt=createdAt
        await writeTeam(root,team)
        return { taskId:task.id, subject:task.subject, id, createdAt, source, sourceFingerprint:fingerprint(source) }
      })
      if (!claim) return
      let record: TaskArchiveRecord | undefined, failure: string | undefined
      try {
        record = await new Promise<TaskArchiveRecord>((resolve,reject) => {
          const worker = new Worker(new URL('./task-archive-worker.js',import.meta.url), {workerData:{root,workspace,teamId,...claim}})
          workers.set(key,{worker,taskId:claim.taskId})
          const timer=setTimeout(()=>{void worker.terminate();reject(new Error('归档超时，请缩小文件范围后重试'))},30000)
          worker.once('message',(result:{record?:TaskArchiveRecord;error?:string})=>{clearTimeout(timer);result.record?resolve(result.record):reject(new Error(result.error??'归档失败'))})
          worker.once('error',error=>{clearTimeout(timer);reject(error)})
          worker.once('exit',()=>{clearTimeout(timer);reject(new Error('归档已中断'))})
        })
      } catch(error) { failure=error instanceof Error?error.message:String(error) }
      finally { await workers.get(key)?.worker.terminate(); workers.delete(key) }
      let published=false
      await withTeamLock(`team:${root}:${teamId}`,async()=>{
        const team=await readTeam(root,teamId),task=team?.tasks.find(t=>t.id===claim.taskId)
        // Stop, rerun, dependency changes and cold recovery revoke the old attempt.
        if(!team||!task||task.attemptId!==claim.id||task.status!=='in_progress')return
        if(!eligible(team,task)){task.status='pending';task.updatedAt=Date.now();delete task.attemptId;await writeTeam(root,team);return}
        if(fingerprint(inputs(team,task))!==claim.sourceFingerprint)failure='归档期间上游记录已变化，请检查后重新归档'
        task.status=failure?'failed':'completed';task.updatedAt=Date.now()
        if(!failure&&record){(task.archiveRecords??=[]).push(record);task.output=`成果归档已生成：${record.manifestPath}\n文件引用 ${record.fileCount} 项，复制 ${record.copiedCount} 项。`;}
        else task.output=failure??'归档未生成'
        await writeTeam(root,team)
        published=!failure&&!!record
      })
      // Only successful state-linked manifests are retained. Interrupted copies
      // are private temporary artifacts, never a second execution history.
      if(!published)for(const suffix of ['', '.partial'])await rm(join(root,teamId,'artifacts',claim.id+suffix),{recursive:true,force:true})
    }
  })()
  running.set(key,work)
  try { await work } finally { if(running.get(key)===work)running.delete(key) }
}
export async function cancelTaskArchive(root:string,teamId:string,taskId?:string):Promise<void>{const current=workers.get(keyOf(root,teamId));if(current&&(!taskId||taskId===current.taskId))await current.worker.terminate()}
export function archiveRunning(root:string,teamId:string):boolean{return running.has(keyOf(root,teamId))}
/** Only records linked from authorized team state can be loaded, never a caller-supplied path. */
export async function readTaskArchive(root:string,team:TeamState,taskId:string,id:string):Promise<unknown>{
  const record=team.tasks.find(t=>t.id===taskId)?.archiveRecords?.find(r=>r.id===id)
  if(!record)throw new Error('归档记录不存在')
  const raw=await readFile(join(root,team.id,'artifacts',record.id,'manifest.json'),'utf8')
  if(fingerprintText(raw)!==record.sha256)throw new Error('归档清单校验失败')
  return JSON.parse(raw)
}
function fingerprintText(raw:string){return createHash('sha256').update(raw).digest('hex')}
