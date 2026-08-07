import { createHash, randomUUID } from "node:crypto";

/**
 * Smartsheet cannot provide a cross-request atomic numeric sequence. A
 * collision-resistant canonical ID is therefore safer than max + 1 in every
 * supported data mode. Reusing a submission ID produces the same smoke ID,
 * making ordinary retries idempotent.
 */
export function createSmokeId(submissionId: string = randomUUID()) {
  const digest = createHash("sha256").update(`cedriva-smoke:${submissionId}`).digest("hex").slice(0, 20);
  return `SMK-${digest.toUpperCase()}`;
}
