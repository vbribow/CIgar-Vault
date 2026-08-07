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
    { label: "Account profile", description: "Confirm your collector profile and collection name.", complete: profileComplete, href: "/account" },
    { label: "Add first cigar", description: "Document one exact cigar to begin your private Vault.", complete: profileComplete && has("inventory"), href: "/inventory#mobile-intake" },
    { label: "Create a humidor", description: "Add the storage environment protecting your collection.", complete: profileComplete && has("humidors"), href: "/humidors" },
    { label: "Connect a sensor", description: "Connect or prepare a climate sensor for monitoring.", complete: profileComplete && connectedSensor, href: "/sensors" },
    { label: "Download inventory backup", description: "Create a recoverable copy of your private inventory.", complete: profileComplete && inventoryBackup, href: "/api/inventory-integrity/backup?scope=account" },
  ];
}
