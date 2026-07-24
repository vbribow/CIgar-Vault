import type { VaultRecordKind } from "./data-authority";

export type VaultMigrationRecord = {
  kind: VaultRecordKind;
  recordId: string;
  payload: unknown;
};

export function planAdditiveSmartsheetMigration(
  source: VaultMigrationRecord[],
  existingByKind: ReadonlyMap<VaultRecordKind, ReadonlySet<string>>,
) {
  const importable: VaultMigrationRecord[] = [];
  const preserved: VaultMigrationRecord[] = [];
  for (const record of source) {
    if (existingByKind.get(record.kind)?.has(record.recordId)) {
      preserved.push(record);
    } else {
      importable.push(record);
    }
  }
  return {
    importable,
    preserved,
    policy:
      "Account records are authoritative. Migration adds missing records and preserves every conflict.",
  };
}
