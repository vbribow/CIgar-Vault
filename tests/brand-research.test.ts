import assert from "node:assert/strict";
import test from "node:test";
import { brandCoverageWithCatalog, brandResearchBacklog, brandResearchSources, classifyDiscovery } from "../lib/brand-research";

const catalog = [{ catalogId: "CAT-1", brand: "Example Cigars", line: "Original", vitola: "Toro" }];

test("discovery classification separates new brands, releases, and duplicates", () => {
  assert.equal(classifyDiscovery({ catalogId: "D-1", brand: "Example Cigar Co.", line: "Original", vitola: "Toro" }, catalog), "Possible duplicate");
  assert.equal(classifyDiscovery({ catalogId: "D-2", brand: "Example Cigars", line: "Second", vitola: "Robusto" }, catalog), "New release");
  assert.equal(classifyDiscovery({ catalogId: "D-3", brand: "Unseen Boutique", line: "Debut", vitola: "Corona" }, catalog), "New brand");
});

test("research backlog puts unresolved boutique brands first and names missing evidence", () => {
  const backlog = brandResearchBacklog();
  assert.ok(backlog.length > 100);
  assert.equal(backlog[0].priority, "Boutique priority");
  assert.ok(backlog.every((item) => item.missing.length >= 3));
  assert.ok(brandResearchSources.some((source) => source.name.includes("Tobacco Plus Expo")));
});

test("approved catalog evidence expands public coverage without inventing factories", () => {
  const coverage = brandCoverageWithCatalog([
    { catalogId: "CAT-NEW", brand: "Unseen Boutique", line: "Debut", vitola: "Corona", country: "Nicaragua", sourceUrl: "https://example.com/debut" },
    { catalogId: "CAT-FACTORY", brand: "Verified Newcomer", line: "First", vitola: "Toro", country: "Dominican Republic", factory: "Verified Factory", sourceUrl: "https://example.com/factory" },
  ]);
  assert.equal(coverage.find((item) => item.brand === "Unseen Boutique")?.status, "Research needed");
  assert.equal(coverage.find((item) => item.brand === "Verified Newcomer")?.status, "Factory verified");
  assert.equal(coverage.find((item) => item.brand === "Verified Newcomer")?.manufacturing, "Verified Factory");
});
