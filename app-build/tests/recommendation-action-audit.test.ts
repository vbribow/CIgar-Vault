import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync(new URL("../components/recommendation-fact-editor.tsx", import.meta.url), "utf8");
const record = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");
const command = readFileSync(new URL("../components/collector-command-center.tsx", import.meta.url), "utf8");
const intelligence = readFileSync(new URL("../components/unified-intelligence-dashboard.tsx", import.meta.url), "utf8");

test("shared recommendation corrections preserve and update only the exact existing lot", () => {
  assert.match(editor, /"vintage" \| "actualCost" \| "provenanceNotes" \| "storageLocationId"/);
  assert.match(editor, /method: "PUT"/);
  assert.doesNotMatch(editor, /method: "POST"/);
  assert.match(editor, /\.\.\.item, \[fact\]: value/);
  assert.match(editor, /router\.refresh\(\)/);
  assert.match(editor, /Leave it blank if the year is not verified/);
});

test("representative year, provenance, and storage recommendations have direct actions", () => {
  assert.match(record, /fact="vintage"/);
  assert.match(record, /fact="provenanceNotes"/);
  assert.match(record, /fact="storageLocationId"/);
  assert.match(record, /Add a humidor first/);
});

test("aggregate recommendations route to the correct safe correction workspace", () => {
  assert.match(inventory, /title:"Correct quantities and years".*href:"\/inventory-count"/);
  assert.match(command, /Review undated lots →/);
  assert.match(intelligence, /Complete missing facts/);
});
