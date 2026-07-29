import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("components/inventory-file-import.tsx", "utf8");

test("every spreadsheet operation releases its busy state", () => {
  assert.equal((source.match(/finally \{/g) || []).length, 3);
  assert.equal((source.match(/setBusy\(false\)/g) || []).length, 3);
});

test("unreadable responses never imply that records were saved or removed", () => {
  assert.match(source, /Nothing was assumed saved/);
  assert.match(source, /No records were assumed removed/);
});

test("rollback explicitly preserves later collector edits", () => {
  assert.match(source, /later-edited record\(s\) were preserved and remain in your Vault/);
  assert.match(source, /disabled=\{!row\.item \|\| busy \|\| Boolean\(batch\)\}/);
});
