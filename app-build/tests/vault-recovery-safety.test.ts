import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel = readFileSync(new URL("../components/vault-recovery-panel.tsx", import.meta.url), "utf8");
const account = readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8");
const inventoryImport = readFileSync(new URL("../components/inventory-file-import.tsx", import.meta.url), "utf8");

test("recovery preview explains ownership, conflicts, and exact impact before writing", () => {
  assert.match(panel, /Different account identity detected/);
  assert.match(panel, /I confirm this export belongs to me/);
  assert.match(panel, /Conflicting current records will be replaced/);
  assert.match(panel, /No Vault records will be changed/);
  assert.match(panel, /Nothing has been restored/);
});

test("account continuity copy distinguishes account records from device-only work", () => {
  assert.match(account, /Moving to another device/);
  assert.match(account, /Unsubmitted browser drafts and selected photos stay on the original device/);
  assert.match(account, /does not include your password, consent history, or billing credentials/);
  assert.match(panel, /Profile and preference snapshots remain in the export for reference but are not automatically applied/);
});

test("recovery and import status are announced and spreadsheet choices are labeled", () => {
  assert.match(panel, /aria-live="polite"/);
  assert.match(panel, /No records were assumed changed/);
  assert.match(inventoryImport, /aria-label=\{`Include spreadsheet row/);
});
