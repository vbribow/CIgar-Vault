import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/inventory/[inventoryId]/page.tsx", "utf8");

test("a failed inventory load never becomes a false missing cigar", () => {
  assert.match(page, /Inventory record protected/);
  assert.match(page, /has not been classified as missing or deleted/);
  assert.ok(page.indexOf("inventoryResult.status") < page.indexOf("if (!item) notFound()"));
});

test("individual cigar evidence fails independently and transparently", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /Published reviews.*UnavailableEvidence/s);
  assert.match(page, /Valuation evidence.*UnavailableEvidence/s);
  assert.match(page, /Climate evidence.*UnavailableEvidence/s);
  assert.match(page, /not treating an unavailable journal as an empty history/);
  assert.match(page, /paused the combined timeline rather than presenting a partial record as complete/);
});
