export type AccountChecklistRecord = { kind: string; payload?: unknown };

export type AccountChecklistItem = {
  label: string;
  description: string;
  href: string;
  complete: boolean;
};

export function buildAccountChecklist(profileComplete: boolean, records: AccountChecklistRecord[], hasFeedback = false): AccountChecklistItem[] {
  const has = (kind: string) => records.some(record => record.kind === kind);
  const inventoryBackup = records.some(record => {
    if (record.kind !== "integrity" || !record.payload || typeof record.payload !== "object") return false;
    return (record.payload as { action?: unknown }).action === "inventory-backup";
  });
  const connectedSensor = records.some(record => {
    if (record.kind !== "sensors" || !record.payload || typeof record.payload !== "object") return false;
    const status = String((record.payload as { connectionStatus?: unknown }).connectionStatus ?? "");
    return status === "Connected" || status === "Ready";
  });

  return [
    { label: "Account profile", complete: profileComplete, href: "/account" },
    { label: "Add first cigar", complete: has("inventory"), href: "/inventory#mobile-intake" },
    { label: "Create a humidor", complete: has("humidors"), href: "/humidors" },
    { label: "Connect a sensor", complete: connectedSensor, href: "/sensors" },
    { label: "Download inventory backup", complete: inventoryBackup, href: "/api/inventory-integrity/backup?scope=account" },
  ];
}
