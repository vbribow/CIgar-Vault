export type AccountChecklistRecord = { kind: string; payload?: unknown };

export type AccountChecklistItem = {
  label: string;
  description: string;
  href: string;
  complete: boolean;
};

export function buildAccountChecklist(profileComplete: boolean, records: AccountChecklistRecord[], hasFeedback = false): AccountChecklistItem[] {
  const has = (kind: string) => records.some(record => record.kind === kind);
  const inventory = records.filter(record => record.kind === "inventory");
  const inventoryCounted = inventory.length > 0 && inventory.every(record => {
    if (!record.payload || typeof record.payload !== "object") return false;
    return (record.payload as { currentQty?: unknown }).currentQty !== undefined;
  });
  const hasBackup = records.some(record => {
    if (record.kind !== "integrity" || !record.payload || typeof record.payload !== "object") return false;
    return (record.payload as { action?: unknown }).action === "inventory-backup";
  });

  return [
    { label: "Complete your collector profile", description: "Tell the app where you are in your collecting journey.", complete: profileComplete, href: "/account" },
    { label: "Bring in your collection", description: "Import an existing file or add your first cigar.", complete: has("inventory"), href: "/inventory" },
    { label: "Verify the physical count", description: "Confirm every recorded lot matches the cigars you own.", complete: inventoryCounted, href: "/inventory-count" },
    { label: "Document one smoking experience", description: "Capture what you noticed so your history starts becoming useful.", complete: has("smokes"), href: "/smoking-log" },
    { label: "Create a recovery point", description: "Download a private copy and record the first tested safeguard.", complete: hasBackup, href: "/account#recovery-point" },
    { label: "Share first-session feedback", description: "Tell us what felt clear, confusing, or especially valuable.", complete: hasFeedback, href: "/feedback" },
  ];
}
