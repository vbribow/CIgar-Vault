import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the main Inventory editor restores owner-scoped drafts without passwords or files", () => {
  const manager = read("components/inventory-manager.tsx");
  const draftHook = read("components/use-device-form-draft.ts");
  assert.match(manager, /useDeviceFormDraft\(`hojavia:form-draft:inventory:/);
  assert.match(manager, /inventoryDraft\.formRef/);
  assert.match(manager, /inventoryDraft\.capture/);
  assert.match(manager, /inventoryDraft\.clear/);
  assert.match(manager, /unfinished inventory details were restored/i);
  assert.match(draftHook, /\["password", "file"\]/);
});

test("journal success and missing-record states always offer a clear next action", () => {
  const manager = read("components/records-manager.tsx");
  const page = read("app/records/page.tsx");
  assert.match(manager, /Log this cigar again/);
  assert.match(manager, /Return to Vault/);
  assert.match(manager, /Valuation evidence saved/);
  assert.match(manager, /Review valuation history/);
  assert.match(page, /Choose a cigar from my Vault/);
  assert.match(page, /Log a cigar without changing inventory/);
});

test("mobile completion and record actions retain platinum touch targets", () => {
  const styles = read("app/styles.css");
  assert.match(styles, /mobileLotActions a\{[\s\S]*min-height:44px/);
  assert.match(styles, /mutationCompletion :is\(\.button,\.textLink\)[\s\S]*min-height:48px/);
  assert.match(styles, /recordUnavailableActions/);
  assert.match(styles, /touch-action:manipulation/);
});

test("support retries preserve the exact failed support operation", () => {
  const manager = read("components/inventory-manager.tsx");
  assert.match(manager, /setFailedSupportKind\(kind\)/);
  assert.match(manager, /loadSupport\(failedSupportKind\)/);
});
