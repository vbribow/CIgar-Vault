import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

test("official Habanos tools open separately so Hojavía remains available", () => {
  const catalog = fs.readFileSync(path.join(root, "app/catalog/page.tsx"), "utf8");
  const verification = fs.readFileSync(path.join(root, "app/verification/page.tsx"), "utf8");
  const guide = fs.readFileSync(path.join(root, "app/learn/habanos-authenticity/page.tsx"), "utf8");
  const inventoryDetail = fs.readFileSync(path.join(root, "app/inventory/[inventoryId]/page.tsx"), "utf8");
  assert.match(catalog, /href=\{habanosBrandSource\}>Official Habanos directory/);
  for (const page of [verification, guide, inventoryDetail]) {
    assert.match(page, /href=\{HABANOS_AUTHENTICITY_URL\} target="_blank" rel="noreferrer">Open Habanos official lookup/);
    assert.match(page, /Official tools open in a new tab/);
    assert.doesNotMatch(page, /Use your browser’s Back button to return/);
  }
  assert.doesNotMatch(catalog, /href=\{habanosBrandSource\} target="_blank"/);
});

test("read-only education and reference journeys stay in one browser tab", () => {
  const readOnlyJourneys = [
    "app/page.tsx",
    "app/discover/page.tsx",
    "app/box-formats/page.tsx",
    "app/catalog/page.tsx",
    "app/catalog/[catalogId]/page.tsx",
    "app/collection-catalog/page.tsx",
    "app/collections/[collectionId]/page.tsx",
    "app/cigars/[identityId]/page.tsx",
    "app/industry/registry/page.tsx",
    "app/industry/[slug]/page.tsx",
    "app/learn/blending/page.tsx",
    "app/learn/humidor-climate/page.tsx",
    "app/learn/seed-to-smoke/page.tsx",
    "app/learn/vitolas/page.tsx",
    "components/manufacturing-truth-directory.tsx",
  ];

  for (const journey of readOnlyJourneys) {
    const source = fs.readFileSync(path.join(root, journey), "utf8");
    assert.doesNotMatch(source, /\btarget=/, `${journey} should preserve browser Back history`);
  }
});
