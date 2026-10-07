import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath: string) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("global no-result search preserves the identity across next actions", () => {
  const search = read("components/global-search.tsx");
  assert.match(search, /Your search is preserved/);
  assert.match(search, /cigarName=\$\{encodeURIComponent\(query\)\}/);
  assert.match(search, /Research “\{query\}”/);
  assert.match(search, /Add “\{query\}” manually/);
});

test("Vault no-result state can clear, research, or create", () => {
  const inventory = read("components/inventory-manager.tsx");
  assert.match(inventory, /productiveEmpty/);
  assert.match(inventory, /onClick=\{clearInventorySearch\}/);
  assert.match(inventory, /Research “\{query\}”/);
  assert.match(inventory, />Add manually</);
});

test("unavailable paid research never blocks manual intake", () => {
  const research = read("components/research-any-cigar.tsx");
  assert.match(research, /Live research awaiting billing activation/);
  assert.match(research, /Add manually without research/);
  assert.match(research, /add=new&cigarName=\$\{encodeURIComponent\(query\)\}/);
});
