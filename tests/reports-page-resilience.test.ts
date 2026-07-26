import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/reports/page.tsx", import.meta.url),
  "utf8",
);

test("insurance totals are never generated without authoritative inventory", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /No\s+scheduled value, coverage percentage, or evidence exception has\s+been inferred from partial data/);
});

test("climate outages remain distinct from zero climate exposure", () => {
  assert.match(page, /const climateReady/);
  assert.match(page, /climateReady \? money\.format\(report\.totals\.valueAtClimateRisk\) : "—"/);
  assert.match(page, /has not interpreted that outage as zero climate exposure/);
});
