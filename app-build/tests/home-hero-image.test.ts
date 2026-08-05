import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const home = readFileSync("app/page.tsx", "utf8");
const heroPath = "public/editorial/cigar-roller-hojavia.jpg";

test("the home hero uses the optimized deployed Hojavía photograph", () => {
  assert.match(home, /src=\{"\/editorial\/cigar-roller-hojavia\.jpg"\}/);
  assert.ok(statSync(heroPath).size > 100_000, "hero image must contain the real photograph");
  assert.ok(statSync(heroPath).size < 750_000, "hero image must remain phone-friendly");
});
