import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

test("official Habanos journeys preserve browser history so Back returns to Hojavía", () => {
  const catalog = fs.readFileSync(path.join(root, "app/catalog/page.tsx"), "utf8");
  const verification = fs.readFileSync(path.join(root, "app/verification/page.tsx"), "utf8");
  const guide = fs.readFileSync(path.join(root, "app/learn/habanos-authenticity/page.tsx"), "utf8");
  const inventoryDetail = fs.readFileSync(path.join(root, "app/inventory/[inventoryId]/page.tsx"), "utf8");
  assert.match(catalog, /href=\{habanosBrandSource\}>Official Habanos directory/);
  for (const page of [verification, guide, inventoryDetail]) {
    assert.match(page, /href=\{HABANOS_AUTHENTICITY_URL\}>Open Habanos official lookup/);
    assert.doesNotMatch(page, /href=\{HABANOS_AUTHENTICITY_URL\} target="_blank"/);
    assert.match(page, /Use your browser’s Back button to return/);
  }
  assert.doesNotMatch(catalog, /href=\{habanosBrandSource\} target="_blank"/);
});
