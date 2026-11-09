import { createHash } from 'node:crypto'
import { parentPort, workerData } from 'node:worker_threads'
import { readArtifactScope } from './artifacts.ts'

try {
  const { workspace, paths } = workerData as { workspace: string; paths: string[] }
  const files = readArtifactScope(workspace, paths)
  if (files.gaps.length || files.artifacts.some(f => f.unreadable)) throw new Error('循环审核材料无法完整读取，请检查文件范围')
  parentPort?.postMessage({ evidence: createHash('sha256').update(JSON.stringify(files)).digest('hex') })
} catch (error) {
  parentPort?.postMessage({ error: error instanceof Error ? error.message : '审核文件读取失败' })
}
