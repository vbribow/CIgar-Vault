import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("primary Cedriva navigation preserves the application shell", () => {
  assert.match(navigation, /import Link from "next\/link"/);
  assert.doesNotMatch(navigation, /<a href="\/(discover|inventory|learn|community|cigar-somm|notifications|account)"/);
  assert.match(navigation, /<Link href="\/inventory"/);
});

test("the Valuable Collections workspace uses a prefetched client transition", () => {
  assert.match(inventory, /<Link href="\/collections" prefetch>/);
  assert.match(inventory, /Valuable Collections/);
  assert.doesNotMatch(inventory, /<a[^>]+href="\/collections"/);
});
