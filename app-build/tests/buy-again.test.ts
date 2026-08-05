import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BuyAgainIntentSchema, safeRecordedPurchaseUrl, sameBuyAgainTarget } from "../lib/buy-again";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("buy again intents are exact, retry-safe, and reject unsafe outbound protocols", () => {
  const submissionId = "11111111-1111-4111-8111-111111111111";
  assert.equal(BuyAgainIntentSchema.safeParse({ inventoryId: "INV-1", submissionId }).success, true);
  assert.equal(BuyAgainIntentSchema.safeParse({ inventoryId: "INV-1" }).success, false);
  assert.equal(safeRecordedPurchaseUrl("https://example.com/cigar"), "https://example.com/cigar");
  assert.equal(safeRecordedPurchaseUrl("javascript:alert(1)"), undefined);
  assert.equal(sameBuyAgainTarget({ brand: "Padrón", line: "1964 Anniversary", vitola: "Exclusivo" }, { brand: " padrón ", line: "1964  Anniversary", vitola: "Exclusivo" }), true);
  assert.equal(sameBuyAgainTarget({ brand: "Padrón", line: "1964 Anniversary", vitola: "Exclusivo" }, { brand: "Padrón", line: "1964 Anniversary", vitola: "Diplomatico" }), false);
});

test("every cigar record exposes a no-credit buy-again path with transparent sourcing", () => {
  const page = read("app/inventory/[inventoryId]/page.tsx");
  const panel = read("components/buy-again-panel.tsx");
  const route = read("app/api/wishlist/buy-again/route.ts");
  assert.match(page, /<BuyAgainPanel/);
  assert.match(page, /safeRecordedPurchaseUrl/);
  assert.match(panel, /Simple collector utility · no AI credits/);
  assert.match(panel, /Buy again from/);
  assert.match(panel, /Add to buying list/);
  assert.match(panel, /No commercial relationship influences this placement/);
  assert.match(route, /loadInventory\(\)/);
  assert.match(route, /loadWishlist\(\)/);
  assert.match(route, /sameBuyAgainTarget/);
  assert.match(route, /status: "Watching"/);
  assert.match(route, /priority: "High"/);
  assert.match(route, /createOwnedRecord/);
});
