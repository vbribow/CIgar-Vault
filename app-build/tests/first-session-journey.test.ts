import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath: string) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("an empty collection receives one focused first-session path", () => {
  const dashboard = read("components/dashboard.tsx");
  const inventoryPage = read("app/inventory/page.tsx");

  assert.match(dashboard, /if \(!current\.length\)/);
  assert.match(dashboard, /Your first ten minutes/);
  assert.match(dashboard, /Begin with one cigar you know/);
  assert.match(dashboard, /Document my first cigar/);
  assert.match(dashboard, /Practice with a safe example/);
  assert.match(dashboard, /Uncertain details can stay blank/);
  assert.match(inventoryPage, /Start with one cigar—not the whole collection/);
  assert.match(inventoryPage, /href="#mobile-intake"/);
});

test("saving a cigar presents persistent, meaningful next actions", () => {
  const manager = read("components/inventory-manager.tsx");

  assert.match(manager, /const \[lastCreated, setLastCreated\]/);
  assert.match(manager, /setLastCreated\(savedItem\)/);
  assert.match(manager, /className="card firstRecordSuccess" aria-live="polite"/);
  assert.match(manager, /Open saved record/);
  assert.match(manager, /startEditing\(lastCreated,"storage"\)/);
  assert.match(manager, /isCubanInventory\(lastCreated\).*Review Habanos evidence/);
  assert.match(manager, /See my first collection insight/);
  assert.match(manager, /I’m done for now/);
  assert.doesNotMatch(manager, /saved and synchronized/);
});

test("first-session actions remain usable on small screens", () => {
  const styles = read("app/styles.css");

  assert.match(styles, /\.firstSessionSteps\{display:grid;grid-template-columns:repeat\(3,1fr\)/);
  assert.match(styles, /@media\(max-width:760px\)[\s\S]*?\.firstSessionSteps\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.firstRecordActions \.textLink\{[^}]*min-height:44px/);
  assert.match(styles, /\.firstRecordActions \.button\{width:100%\}/);
});
