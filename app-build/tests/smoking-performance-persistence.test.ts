import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findNearDuplicateSmoke } from "../lib/smoke-journal";

test("Smartsheet reads and writes Construction Quality and Burn without silent loss", () => {
  const source = readFileSync(new URL("../lib/smartsheet.ts", import.meta.url), "utf8");
  assert.match(source, /construction:\s*v\.get\("Construction"\)/);
  assert.match(source, /burn:\s*v\.get\("Burn"\)/);
  assert.match(source, /\["Construction",log\.construction\]/);
  assert.match(source, /\["Burn",log\.burn\]/);
  assert.match(source, /requireRecordColumns\(smokingSheet\.columns,\["Burn"\]\)/);
});

test("duplicate protection distinguishes separate construction or burn experiences", () => {
  const base = {
    smokeId: "SMK-1",
    inventoryId: "INV-0053",
    dateSmoked: "2026-07-27",
    overall: 92,
    construction: "Excellent",
    burn: "Even throughout",
  };
  assert.equal(findNearDuplicateSmoke([base], { ...base, smokeId: "SMK-2" })?.smokeId, "SMK-1");
  assert.equal(findNearDuplicateSmoke([base], { ...base, smokeId: "SMK-3", burn: "Minor touch-up" }), undefined);
  assert.equal(findNearDuplicateSmoke([base], { ...base, smokeId: "SMK-4", construction: "Very good" }), undefined);
});

test("journal and Cigar Somm expose physical performance without fabricating blanks", () => {
  const story = readFileSync(new URL("../app/cigars/[identityId]/page.tsx", import.meta.url), "utf8");
  const inventory = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
  const somm = readFileSync(new URL("../lib/cigar-somm.ts", import.meta.url), "utf8");
  assert.match(story, /Construction: \$\{item\.construction\}/);
  assert.match(story, /Burn: \$\{item\.burn\}/);
  assert.match(inventory, /s\.construction\|\|s\.burn/);
  assert.match(somm, /constructionQuality:value\.construction,burn:value\.burn/);
  assert.match(somm, /missing values must remain unknown/);
});
