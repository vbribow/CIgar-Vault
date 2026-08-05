import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { certificationDisplayLabels, loungeLeafCount } from "../lib/places";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy assessment values map to a stable one-to-three leaf distinction", () => {
  assert.equal(loungeLeafCount("Cedriva Certified"), 1);
  assert.equal(loungeLeafCount("Cedriva Distinguished"), 2);
  assert.equal(loungeLeafCount("Cedriva Destination"), 3);
  assert.equal(loungeLeafCount("Not Yet Certified"), 0);
  assert.match(certificationDisplayLabels["Cedriva Destination"], /Three Leaves/);
});

test("lounge leaves are visible, evidence-led, and commercially independent", () => {
  const component = read("components/lounge-leaf-rating.tsx");
  const directory = read("components/place-directory.tsx");
  const page = read("app/places/page.tsx");
  assert.match(component, /HojaviaMark/);
  assert.match(component, /The Three-Leaf Lounge Standard/);
  assert.match(component, /Cannot be purchased/);
  assert.match(component, /not affiliated with any restaurant, hotel, or travel-rating organization/);
  assert.match(component, /visit date, evidence, disclosure, and next-review date/);
  assert.match(directory, /LoungeLeafRating level=\{place\.certification\.level\}/);
  assert.match(directory, /Critic score/);
  assert.match(page, /Independent leaf distinction/);
  assert.match(page, /Community consensus and independent criticism stay separate/);
});
