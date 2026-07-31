import { createHash, randomUUID } from "node:crypto";

const prefixes = {
  activity: "ACT",
  collection: "COL",
  humidor: "HUM",
  inventory: "INV",
  reading: "READ",
  rating: "RATE",
  sensor: "SENSOR",
  valuation: "VAL",
  wishlist: "WISH",
} as const;

export type ServerRecordKind = keyof typeof prefixes;

/**
 * Creates a canonical record ID on the trusted server. A client may supply an
 * opaque submission UUID only so a network retry resolves to the same record;
 * it never controls the resulting canonical ID.
 */
export function createServerRecordId(kind: ServerRecordKind, submissionId: string = randomUUID()) {
  const digest = createHash("sha256")
    .update(`cedriva:${kind}:${submissionId}`)
    .digest("hex")
    .slice(0, 20)
    .toUpperCase();
  return `${prefixes[kind]}-${digest}`;
}
