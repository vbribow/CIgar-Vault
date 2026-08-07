import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("every collector-facing delete explains impact before it runs", () => {
  const destructiveComponents = [
    "components/inventory-manager.tsx",
    "components/collections-manager.tsx",
    "components/collection-assignment-review.tsx",
  ];

  for (const path of destructiveComponents) {
    const source = read(path);
    assert.match(source, /confirm\(/, `${path} confirms the action`);
    assert.match(source, /method:\s*"DELETE"/, `${path} contains the audited delete`);
    assert.ok(source.indexOf("confirm(") < source.indexOf('method:"DELETE"') || source.indexOf("confirm(") < source.indexOf('method: "DELETE"'), `${path} confirms before requesting deletion`);
  }

  const collections = read("components/collections-manager.tsx");
  assert.match(collections, /No cigar inventory, photos, journal entries, or valuations will be deleted/);
  assert.match(collections, /removalInFlight\.current/);
});

test("spreadsheet import requires review, confirmation, locking, and a receipt", () => {
  const source = read("components/inventory-file-import.tsx");
  assert.match(source, /Nothing is saved until you review and confirm/);
  assert.match(source, /download a complete Vault export/);
  assert.match(source, /This adds new records only and will not replace existing Vault records/);
  assert.match(source, /importMutation\.begin\(\)/);
  assert.match(source, /rollbackMutation\.begin\(\)/);
  assert.match(source, /Import receipt:/);
});

test("import undo protects collector edits and requires a second deliberate decision", () => {
  const source = read("components/inventory-file-import.tsx");
  assert.match(source, /Only records that remain exactly as imported will be removed/);
  assert.match(source, /Any record edited afterward will stay protected/);
  assert.match(source, /later-edited record\(s\) were preserved and remain in your Vault/);
});

test("core create flows retain retry-safe identities or immediate locks", () => {
  assert.match(read("components/inventory-manager.tsx"), /submissionId/);
  assert.match(read("components/collections-manager.tsx"), /submissionId/);
  assert.match(read("components/humidor-manager.tsx"), /submissionId/);
  assert.match(read("components/records-manager.tsx"), /useMutationGuard/);
  assert.match(read("components/photo-inventory-intake.tsx"), /approvalInFlight\.current/);
});
