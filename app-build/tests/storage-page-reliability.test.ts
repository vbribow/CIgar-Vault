import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/storage/page.tsx", import.meta.url),
  "utf8",
);

test("Storage never interprets unavailable inventory as an empty vault", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /No\s+location has been classified as empty/);
});

test("Storage represents current holdings rather than consumed history", () => {
  assert.match(page, /filter\(isCurrentInventoryRecord\)/);
  assert.match(page, /current lots/);
});
