import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { certificationDisplayLabels, certificationLevels } from "../lib/places";

const root = resolve(import.meta.dirname, "..");
const futureFacingSurfaces = [
  "app/community/page.tsx",
  "components/community-hub.tsx",
  "app/places/page.tsx",
  "app/places/rate/page.tsx",
  "components/place-directory.tsx",
  "components/industry-workspace.tsx",
  "app/industry/registry/page.tsx",
  "components/founder-onboarding.tsx",
];

const brandIndependentPresentationSurfaces = [
  "app/alerts/page.tsx",
  "app/auction-market/page.tsx",
  "app/catalog-discovery/page.tsx",
  "app/catalog/[catalogId]/page.tsx",
  "app/cigars/[identityId]/page.tsx",
  "app/collections/[collectionId]/page.tsx",
  "app/decision-center/page.tsx",
  "app/founder-onboarding/page.tsx",
  "app/industry/[slug]/page.tsx",
  "app/inventory-integrity/page.tsx",
  "app/inventory/[inventoryId]/page.tsx",
  "app/legacy/page.tsx",
  "app/partner-platform/page.tsx",
  "app/partner-workspace/page.tsx",
  "app/reports/page.tsx",
  "app/sommelier-library/page.tsx",
  "app/trust-scorecard/page.tsx",
  "app/valuations/page.tsx",
  "components/beta-feedback-form.tsx",
  "components/brand-research-workspace.tsx",
  "components/integrity-manager.tsx",
  "components/inventory-file-import.tsx",
  "components/partner-workspace.tsx",
  "components/password-recovery-form.tsx",
  "components/private-record-export.tsx",
  "components/vault-recovery-panel.tsx",
  "components/lounge-leaf-rating.tsx",
];

test("future-facing product surfaces do not recreate retired branded subproducts", () => {
  const source = futureFacingSurfaces
    .map(file => readFileSync(resolve(root, file), "utf8"))
    .join("\n");

  for (const retiredLabel of [
    "Cedriva 25",
    "Cedriva Places",
    "Cedriva Lounge Passport",
    "Cedriva Industry Hub",
    "Cedriva private beta",
  ]) {
    assert.equal(source.includes(retiredLabel), false, retiredLabel);
  }
});

test("legacy location status values remain readable but are never the display labels", () => {
  assert.equal(certificationLevels.includes("Cedriva Certified"), true);
  assert.equal(certificationDisplayLabels["Cedriva Certified"], "One Leaf · Recommended");
  assert.equal(certificationDisplayLabels["Cedriva Distinguished"], "Two Leaves · Distinguished");
  assert.equal(certificationDisplayLabels["Cedriva Destination"], "Three Leaves · Destination");
});

test("priority presentation surfaces contain no hard-coded retired company name", () => {
  for (const file of brandIndependentPresentationSurfaces) {
    const source = readFileSync(resolve(root, file), "utf8");
    assert.equal(source.includes("Cedriva"), false, file);
  }
});

test("outbound alert and wishlist messages resolve through the brand configuration", () => {
  for (const file of ["lib/alert-notifications.ts", "lib/wishlist-availability.ts"]) {
    const source = readFileSync(resolve(root, file), "utf8");
    assert.match(source, /brand\.name/, file);
    assert.equal(source.includes("Cedriva"), false, file);
  }
});
