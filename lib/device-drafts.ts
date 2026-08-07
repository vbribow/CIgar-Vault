export const DEVICE_DRAFT_PREFIX = "hojavia:device-draft:v2:";
export const CURRENT_DEVICE_DRAFT_OWNER = "hojavia:device-draft-owner:v1";
export const DEVICE_DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type DeviceDraftRecord = {
  version: 2;
  ownerKey: string;
  formKey: string;
  label: string;
  href: string;
  updatedAt: string;
  expiresAt: string;
  fields: Record<string, string[]>;
};

export type DeviceDraftSummary = Omit<DeviceDraftRecord, "fields" | "ownerKey" | "version"> & { storageKey: string };

export function deviceDraftDescriptor(formKey: string) {
  if (formKey.includes("wishlist-purchase")) return { label: "Purchased cigar", href: "/wishlist" };
  if (formKey.includes("humidor-reading")) return { label: "Climate reading", href: "/humidors" };
  if (formKey.includes("humidor")) return { label: "Humidor setup", href: "/humidors" };
  if (formKey.includes("valuation")) return { label: "Valuation evidence", href: "/records" };
  if (formKey.includes("activity")) return { label: "Collection activity", href: "/activity" };
  if (formKey.includes("smoke")) return { label: "Tasting journal", href: "/records#log-smoke" };
  return { label: "Unfinished form", href: "/account" };
}

export const deviceDraftStorageKey = (ownerKey: string, formKey: string) => `${DEVICE_DRAFT_PREFIX}${ownerKey}:${formKey}`;

export function createDeviceDraft(ownerKey: string, formKey: string, fields: Record<string, string[]>, now = new Date()): DeviceDraftRecord {
  const descriptor = deviceDraftDescriptor(formKey);
  return { version: 2, ownerKey, formKey, ...descriptor, updatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + DEVICE_DRAFT_TTL_MS).toISOString(), fields };
}

export function parseDeviceDraft(raw: string | null, ownerKey: string, now = new Date()): DeviceDraftRecord | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as DeviceDraftRecord;
    const validFields = value?.fields && typeof value.fields === "object" && Object.values(value.fields).every((fields) => Array.isArray(fields) && fields.every((field) => typeof field === "string"));
    if (value?.version !== 2 || value.ownerKey !== ownerKey || !value.formKey || !validFields || !Number.isFinite(new Date(value.updatedAt).getTime()) || new Date(value.expiresAt).getTime() <= now.getTime()) return undefined;
    return value;
  } catch { return undefined; }
}

export function rememberCurrentDraftOwner(ownerKey: string, storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(CURRENT_DEVICE_DRAFT_OWNER, ownerKey);
}

export function listDeviceDrafts(ownerKey: string, storage: Pick<Storage, "length" | "key" | "getItem" | "removeItem"> = window.localStorage, now = new Date()) {
  const drafts: DeviceDraftSummary[] = [];
  const prefix = `${DEVICE_DRAFT_PREFIX}${ownerKey}:`;
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key?.startsWith(prefix)));
  for (const storageKey of keys) {
    const value = parseDeviceDraft(storage.getItem(storageKey), ownerKey, now);
    if (!value) { storage.removeItem(storageKey); continue; }
    const { fields: _fields, ownerKey: _owner, version: _version, ...summary } = value;
    drafts.push({ ...summary, storageKey });
  }
  return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function clearDeviceDrafts(ownerKey: string, storage: Pick<Storage, "length" | "key" | "removeItem"> = window.localStorage) {
  const prefix = `${DEVICE_DRAFT_PREFIX}${ownerKey}:`;
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key?.startsWith(prefix)));
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}

export function clearCurrentOwnerDrafts(storage: Pick<Storage, "length" | "key" | "getItem" | "removeItem"> = window.localStorage) {
  const ownerKey = storage.getItem(CURRENT_DEVICE_DRAFT_OWNER);
  return ownerKey ? clearDeviceDrafts(ownerKey, storage) : 0;
}
