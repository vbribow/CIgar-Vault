import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/humidors/[humidorId]/page.tsx", import.meta.url),
  "utf8",
);

test("humidor detail distinguishes unavailable evidence from a missing humidor", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /humidorsResult\.status !== "fulfilled"/);
  assert.match(page, /readingsResult\.status !== "fulfilled"/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /has not been classified as\s+missing, stable, or empty/);
  assert.ok(page.indexOf("if (") < page.indexOf("if (!humidor) notFound()"));
});
