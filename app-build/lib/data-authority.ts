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
export type DataAuthority = "supabase-private-vault" | "smartsheet-founder-master" | "none";

export type DataAuthorityRule = {
  kind: VaultRecordKind;
  signedInAuthority: "supabase-private-vault";
  signedOutFallback: DataAuthority;
  migrationDirection: "explicit-smartsheet-to-supabase" | "none";
  conflictRule: string;
};

const smartsheetFallback = new Set<VaultRecordKind>([
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
      signedOutFallback: smartsheetFallback.has(kind) ? "smartsheet-founder-master" : "none",
      migrationDirection: smartsheetFallback.has(kind) ? "explicit-smartsheet-to-supabase" : "none",
      conflictRule: "A signed-in collector's Supabase record wins. Smartsheet is never merged or copied over it automatically.",
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
      && rule.migrationDirection !== ("bidirectional" as string);
  });
}
