export const vaultRecordKinds = [
  "inventory",
  "collections",
  "humidors",
  "readings",
  "sensors",
  "valuations",
  "ratings",
  "rating-drafts",
  "smokes",
  "activities",
  "wishlist",
  "integrity",
  "system-runs",
] as const;

export type VaultRecordKind = typeof vaultRecordKinds[number];
export type DataAuthority = "supabase-private-vault" | "none";

export type DataAuthorityRule = {
  kind: VaultRecordKind;
  signedInAuthority: "supabase-private-vault";
  signedOutFallback: DataAuthority;
  migrationDirection: "explicit-smartsheet-to-supabase" | "none";
  conflictRule: string;
};

const smartsheetMigrationKinds = new Set<VaultRecordKind>([
  "inventory",
  "collections",
  "humidors",
  "readings",
  "sensors",
  "valuations",
  "smokes",
  "activities",
]);

export const vaultDataAuthority: Record<VaultRecordKind, DataAuthorityRule> = Object.fromEntries(
  vaultRecordKinds.map(kind => [
    kind,
    {
      kind,
      signedInAuthority: "supabase-private-vault",
      signedOutFallback: "none",
      migrationDirection: smartsheetMigrationKinds.has(kind) ? "explicit-smartsheet-to-supabase" : "none",
      conflictRule: "A signed-in collector's Supabase record wins. Smartsheet migration may add missing records but never overwrite or merge an existing account record automatically.",
    },
  ]),
) as Record<VaultRecordKind, DataAuthorityRule>;

export function dataAuthorityFor(kind: VaultRecordKind, signedIn: boolean): DataAuthority {
  const rule = vaultDataAuthority[kind];
  return signedIn ? rule.signedInAuthority : rule.signedOutFallback;
}

export function dataAuthorityIsUnambiguous() {
  return vaultRecordKinds.every(kind => {
    const rule = vaultDataAuthority[kind];
    return rule.kind === kind
      && rule.signedInAuthority === "supabase-private-vault"
      && rule.signedOutFallback === "none"
      && rule.migrationDirection !== ("bidirectional" as string);
  });
}

export function scheduledVaultAuthority(
  env: Partial<Record<string, string | undefined>>,
) {
  const supabaseReady = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  if (supabaseReady) return "supabase-private-vault" as const;
  if (
    env.USE_MOCK_DATA === "false" &&
    env.SMARTSHEET_ACCESS_TOKEN?.trim() &&
    env.SMARTSHEET_INVENTORY_SHEET_ID?.trim()
  ) {
    return "smartsheet-legacy-operations" as const;
  }
  return "unavailable" as const;
}
