export type AccountVaultRecord = {
  kind: string;
  record_id: string;
  payload: unknown;
  updated_at?: string;
};

export type IntegrityAudit = { action?: string; createdAt?: string; recordCount?: number };

export function accountSecuritySummary(records: AccountVaultRecord[]) {
  const backups = records.flatMap(record => {
    if (record.kind !== "integrity" || !record.payload || typeof record.payload !== "object") return [];
    const audit = record.payload as IntegrityAudit;
    return audit.action === "inventory-backup" && audit.createdAt ? [audit] : [];
  }).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return {
    recordCount: records.filter(record => record.kind !== "integrity" && record.kind !== "system-runs").length,
    lastBackupAt: backups[0]?.createdAt,
    lastBackupCount: backups[0]?.recordCount,
  };
}

export function buildAccountExport(input: {
  userId: string;
  email?: string;
  profile: unknown;
  preferences: unknown;
  records: AccountVaultRecord[];
  createdAt: string;
}) {
  return {
    format: "cigar-vault-account-export",
    version: 1,
    createdAt: input.createdAt,
    owner: { userId: input.userId, email: input.email },
    profile: input.profile ?? null,
    preferences: input.preferences ?? null,
    recordCount: input.records.length,
    records: input.records,
  };
}
