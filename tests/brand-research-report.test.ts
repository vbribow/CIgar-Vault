import assert from "node:assert/strict";
import test from "node:test";
import { BrandResearchReportSchema } from "../lib/brand-research-report";

test("brand research reports keep ownership and line-level manufacturing separate", () => {
  const report = BrandResearchReportSchema.parse({
    brand: "Example",
    researchedAt: "2026-07-24",
    summary: "A test research report.",
    brandOwner: {
      value: "Example Holdings",
      status: "Verified",
      confidence: "High",
      sourceTitle: "Official company page",
      sourceUrl: "https://example.com/about",
      evidenceDate: "2026-07-24",
      notes: "Owner only.",
    },
    creativeAuthorship: [],
    manufacturingRelationships: [{
      factory: "Example Factory",
      country: "Nicaragua",
      lineOrRelease: "Reserva Toro",
      productionPeriod: "2025-present",
      relationship: "Directed contract production",
      status: "Verified",
      confidence: "High",
      sourceTitle: "Official release",
      sourceUrl: "https://example.com/release",
      evidenceDate: "2026-07-24",
      notes: "Applies only to the named line.",
    }],
    officialSources: [],
    unresolvedQuestions: ["Who blended the release?"],
  });

  assert.equal(report.brandOwner.value, "Example Holdings");
  assert.equal(report.manufacturingRelationships[0].lineOrRelease, "Reserva Toro");
  assert.notEqual(report.brandOwner.value, report.manufacturingRelationships[0].factory);
});
