import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientFiles = [
  "components/activity-manager.tsx",
  "components/collections-manager.tsx",
  "components/humidor-manager.tsx",
  "components/inventory-manager.tsx",
  "components/rating-research-panel.tsx",
  "components/records-manager.tsx",
  "components/retail-pricing-controls.tsx",
  "components/sensor-manager.tsx",
  "components/valuation-completion-panel.tsx",
  "components/valuation-research-panel.tsx",
  "components/wishlist-manager.tsx",
  "lib/inventory-import.ts",
  "lib/wishlist-conversion.ts",
];

test("mobile client workspaces never require crypto.randomUUID", () => {
  for (const file of clientFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /crypto\.randomUUID\(/, file);
    assert.match(source, /createClientUuid/, file);
  }
});
