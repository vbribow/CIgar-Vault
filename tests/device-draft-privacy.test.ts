import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clearDeviceDrafts, createDeviceDraft, deviceDraftStorageKey, listDeviceDrafts, parseDeviceDraft } from "../lib/device-drafts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("device drafts are scoped to one account and summaries never expose fields", () => {
  const storage = new MemoryStorage();
  const formKey = "hojavia:form-draft:smoke:v1";
  storage.setItem(deviceDraftStorageKey("collector-a", formKey), JSON.stringify(createDeviceDraft("collector-a", formKey, { cigar: ["Private cigar"] })));
  assert.equal(listDeviceDrafts("collector-b", storage).length, 0);
  const drafts = listDeviceDrafts("collector-a", storage);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].label, "Tasting journal");
  assert.equal("fields" in drafts[0], false);
  assert.equal(JSON.stringify(drafts).includes("Private cigar"), false);
});

test("expired and damaged drafts are removed automatically", () => {
  const storage = new MemoryStorage();
  const formKey = "hojavia:form-draft:valuation:v1";
  const created = new Date("2026-01-01T00:00:00.000Z");
  const key = deviceDraftStorageKey("collector-a", formKey);
  storage.setItem(key, JSON.stringify(createDeviceDraft("collector-a", formKey, { amount: ["500"] }, created)));
  assert.equal(parseDeviceDraft(storage.getItem(key), "collector-a", new Date("2026-01-16T00:00:00.000Z")), undefined);
  assert.equal(listDeviceDrafts("collector-a", storage, new Date("2026-01-16T00:00:00.000Z")).length, 0);
  assert.equal(storage.getItem(key), null);
  storage.setItem(key, "{damaged");
  assert.equal(listDeviceDrafts("collector-a", storage).length, 0);
  assert.equal(storage.getItem(key), null);
  storage.setItem(key, JSON.stringify({ ...createDeviceDraft("collector-a", formKey, {}), fields: { amount: "not-an-array" } }));
  assert.equal(listDeviceDrafts("collector-a", storage).length, 0);
  assert.equal(storage.getItem(key), null);
});

test("clearing drafts cannot remove another account's unfinished work", () => {
  const storage = new MemoryStorage();
  const formKey = "hojavia:form-draft:activity:v1";
  for (const owner of ["collector-a", "collector-b"]) storage.setItem(deviceDraftStorageKey(owner, formKey), JSON.stringify(createDeviceDraft(owner, formKey, { note: [owner] })));
  assert.equal(clearDeviceDrafts("collector-a", storage), 1);
  assert.equal(listDeviceDrafts("collector-a", storage).length, 0);
  assert.equal(listDeviceDrafts("collector-b", storage).length, 1);
});

test("the UI keeps ownership server-verified and explains local privacy controls", () => {
  const route = read("app/api/account/device-draft-owner/route.ts");
  const hook = read("components/use-device-form-draft.ts");
  const manager = read("components/device-draft-manager.tsx");
  const signOut = read("components/device-aware-sign-out.tsx");
  const account = read("app/account/page.tsx");
  const navigation = read("components/app-navigation.tsx");
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /status: 401/);
  assert.match(hook, /deviceDraftStorageKey/);
  assert.match(hook, /createDeviceDraft/);
  assert.match(hook, /parseDeviceDraft/);
  assert.match(manager, /expire automatically after 14 days/);
  assert.match(manager, /Passwords and selected photos are never included/);
  assert.match(manager, /not account-synced Vault records/);
  assert.match(signOut, /Also clear my unfinished browser-only work/);
  assert.match(account, /DeviceDraftManager ownerKey=\{user\.id\}/);
  assert.match(navigation, /DeviceAwareSignOut compact/);
});
