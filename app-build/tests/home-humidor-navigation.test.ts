import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync(new URL("../components/dashboard.tsx", import.meta.url), "utf8");

test("Home gives humidor climate a first-class destination with sensor access", () => {
  assert.match(dashboard, /function HomeClimateCard/);
  assert.match(dashboard, /Humidor climate/);
  assert.match(dashboard, /href="\/humidors">Open Humidors/);
  assert.match(dashboard, /href="\/sensors">Manage Sensors/);
  assert.equal((dashboard.match(/<HomeClimateCard intelligence=\{intelligence\} \/>/g) || []).length, 2);
});
