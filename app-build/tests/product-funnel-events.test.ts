import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("successful Cigar Somm use records a content-free, consent-aware milestone", () => {
  const route = readFileSync(new URL("../app/api/cigar-somm/route.ts", import.meta.url), "utf8");
  assert.match(route, /preference\?\.product_analytics === false/);
  assert.match(route, /event_type: "cigar-somm-used"/);
  assert.match(route, /properties: \{\}/);
  assert.match(route, /must never block the collector's answer/);
});

test("successful inventory import records the completion milestone without row content", () => {
  const component = readFileSync(new URL("../components/inventory-file-import.tsx", import.meta.url), "utf8");
  assert.match(component, /eventType: "import-completed"/);
  assert.doesNotMatch(component, /eventType: "import-completed"[\s\S]{0,100}properties:/);
});
