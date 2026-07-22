import assert from "node:assert/strict";
import test from "node:test";
import { buildCollectorNotifications } from "../lib/collector-notifications";
import type { WishlistItem } from "../lib/types";

const base: WishlistItem = { wishlistId: "W1", brand: "Fuente", line: "OpusX", vitola: "Petite Lancero", priority: "High", targetPrice: 40, status: "Watching", createdAt: "2026-07-20T00:00:00.000Z" };

test("builds and prioritizes price matches", () => {
  const items = [{ ...base, availabilityLastCheckedAt: "2026-07-21T00:00:00.000Z", priceMatches: [{ url: "https://example.com/cigar", seller: "Dealer", price: 35, targetPrice: 40, basis: "Per cigar" as const, availability: "In stock" as const }] }];
  const result = buildCollectorNotifications(items, new Date("2026-07-21T12:00:00.000Z"));
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "Price match");
  assert.equal(result[0].priority, "High");
});

test("flags stale watches and unconverted purchases", () => {
  const purchased: WishlistItem = { ...base, wishlistId: "W2", status: "Purchased", purchasedAt: "2026-07-21T00:00:00.000Z" };
  const result = buildCollectorNotifications([base, purchased], new Date("2026-07-22T00:00:00.000Z"));
  assert.ok(result.some(item => item.kind === "Monitoring"));
  assert.ok(result.some(item => item.kind === "Purchase follow-up"));
});
