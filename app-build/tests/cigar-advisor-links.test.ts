import assert from "node:assert/strict";
import test from "node:test";
import { cigarAdvisorActions, cigarAdvisorHref } from "../lib/cigar-advisor-links";
import type { InventoryItem } from "../lib/types";

const item: InventoryItem = { inventoryId: "INV 1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", vintage: 2025, collectionId: "COL-1" };

test("inventory advisor links preserve exact inventory identity and collector intent", () => {
  const url = new URL(cigarAdvisorHref(item, "aging"), "https://cedriva.example");
  assert.equal(url.pathname, "/cigar-somm");
  assert.equal(url.searchParams.get("inventoryId"), "INV 1");
  assert.match(url.searchParams.get("question") || "", /Cohiba Siglo IV Corona Gorda/);
  assert.match(url.searchParams.get("question") || "", /2025/);
});

test("inventory records expose aging, pairing, value, and collection guidance", () => {
  const actions = cigarAdvisorActions(item);
  assert.deepEqual(actions.map(action => action.intent), ["aging", "pairing", "value", "collection"]);
  assert.match(new URL(actions[2].href, "https://cedriva.example").searchParams.get("question") || "", /completed-sale evidence/);
  assert.match(new URL(actions[3].href, "https://cedriva.example").searchParams.get("question") || "", /linked collection/);
});

test("complete assessment remains the primary inventory action", () => {
  const question = new URL(cigarAdvisorHref(item), "https://cedriva.example").searchParams.get("question") || "";
  assert.match(question, /complete, source-aware assessment/);
  assert.match(question, /most useful next action/);
});
