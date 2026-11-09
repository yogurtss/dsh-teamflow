import type { ArtifactDigest } from './types.ts'

/** Read 0.2.8 policy exclusions without reclassifying genuine I/O failures. */
export function artifactSkip(item: ArtifactDigest): ArtifactDigest['skipped'] {
  if (item.skipped) return item.skipped
  if (!item.unreadable || item.size === undefined || !item.reason?.startsWith(`${item.path}: `)) return undefined
  const reason = item.reason.slice(item.path.length + 2)
  if (/^unsupported artifact file type(?:; content not audited)?$/.test(reason)) return 'type'
  if (/^exceeds the \d+-byte file limit(?:; content not audited)?$/.test(reason)) return 'size'
  if (/^exceeds the \d+-byte scope budget(?:; content not audited)?$/.test(reason)) return 'budget'
  return undefined
}

export function normalizeArtifact(item: ArtifactDigest): ArtifactDigest {
  const skipped = artifactSkip(item)
  if (!skipped) return item
  const { unreadable: _unreadable, sha256: _sha256, ...metadata } = item
  return { ...metadata, present: true, skipped }
}

/** Evidence binds audited bytes and the explicit exclusion boundary, not skipped bytes or mtimes. */
export function artifactEvidence(items: readonly ArtifactDigest[]): unknown[] {
  return items.map(normalizeArtifact).map(item => item.skipped
    ? { path: item.path, present: item.present, skipped: item.skipped }
    : item.sha256 ? { path: item.path, present: item.present, sha256: item.sha256, size: item.size }
      : item).sort((a, b) => a.path.localeCompare(b.path))
}
