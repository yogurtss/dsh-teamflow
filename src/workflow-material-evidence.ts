import { createHash } from 'node:crypto'
import { artifactEvidence } from './artifact-policy.ts'

/** Bind reports and audited content, while retaining informational metadata in the saved material. */
export function workflowMaterialEvidence(text: string): string {
  let canonical = text
  try {
    const material = JSON.parse(text)
    if (material?.files && Array.isArray(material.files.artifacts)) {
      canonical = JSON.stringify({ ...material, files: { ...material.files, artifacts: artifactEvidence(material.files.artifacts) } })
    }
  } catch { /* Legacy plain-text materials bind the exact text. */ }
  return createHash('sha256').update(canonical).digest('hex')
}
