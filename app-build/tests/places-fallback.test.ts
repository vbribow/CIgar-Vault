import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("missing live discovery credentials produce a user-safe fallback",()=>{
  const route=readFileSync(
    new URL("../app/api/places/search/route.ts",import.meta.url),
    "utf8",
  );
  assert.match(route,/LIVE_DISCOVERY_UNAVAILABLE/);
  assert.match(route,/temporarily unavailable/);
  assert.doesNotMatch(route,/requires GOOGLE_PLACES_API_KEY/);
  assert.doesNotMatch(route,/GOOGLE_PLACES_API_KEY"},{status:503}/);
});
