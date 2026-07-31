import { createHash } from "node:crypto";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonical(child)]),
    );
  }
  return value;
}

export function importRecordFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function safelyRollbackImportedRecords<T>(
  current: T[],
  idFor: (value: T) => string,
  expectedFingerprints: Record<string, string>,
) {
  const currentById = new Map(current.map(value => [idFor(value), value]));
  const removable: string[] = [];
  const protectedIds: string[] = [];
  const alreadyMissing: string[] = [];
  for (const [id, fingerprint] of Object.entries(expectedFingerprints)) {
    const value = currentById.get(id);
    if (!value) alreadyMissing.push(id);
    else if (importRecordFingerprint(value) === fingerprint) removable.push(id);
    else protectedIds.push(id);
  }
  return { removable, protectedIds, alreadyMissing };
}
