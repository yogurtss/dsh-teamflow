import type { ArtifactDigest } from './types.ts';
/** Read 0.2.8 policy exclusions without reclassifying genuine I/O failures. */
export declare function artifactSkip(item: ArtifactDigest): ArtifactDigest['skipped'];
export declare function normalizeArtifact(item: ArtifactDigest): ArtifactDigest;
/** Evidence binds audited bytes and the explicit exclusion boundary, not skipped bytes or mtimes. */
export declare function artifactEvidence(items: readonly ArtifactDigest[]): unknown[];
