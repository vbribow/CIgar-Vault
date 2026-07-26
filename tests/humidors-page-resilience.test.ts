import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/humidors/page.tsx", import.meta.url),
  "utf8",
);

test("climate intelligence is never calculated from a partial evidence set", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /humidorsResult\.status !== "fulfilled"/);
  assert.match(page, /readingsResult\.status !== "fulfilled"/);
  assert.match(page, /sensorsResult\.status !== "fulfilled"/);
  assert.match(page, /No stability score, climate alert,\s+or value-at-risk figure has been inferred from partial data/);
});
