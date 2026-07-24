import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const learn = readFileSync(new URL("../app/learn/page.tsx", import.meta.url), "utf8");
const foundations = readFileSync(new URL("../app/learn/foundations/page.tsx", import.meta.url), "utf8");
const seedToSmoke = readFileSync(new URL("../app/learn/seed-to-smoke/page.tsx", import.meta.url), "utf8");

test("the Curious pathway opens a dedicated beginner journey", () => {
  assert.match(learn, /"\/learn\/seed-to-smoke","Follow tobacco from seed to smoke"/);
  assert.doesNotMatch(learn, /"Start without intimidation"[^\\n]*"\/catalog"/);
});

test("Seed to Smoke teaches agriculture, craft, roller development, and source distinctions", () => {
  for (const lesson of ["Seed and intention", "Soil and cultivation", "Priming and harvest", "Curing", "Fermentation and aging", "Blend and preparation", "Construction and control", "Master stewardship"]) {
    assert.match(seedToSmoke, new RegExp(lesson));
  }
  assert.match(seedToSmoke, /qualification systems differ by country, era, and factory/);
  assert.match(seedToSmoke, /not as a universal credential/);
  assert.match(seedToSmoke, /Honor the craft without turning legend into fact/);
});

test("foundations teach the complete first-cigar experience in plain language", () => {
  for (const lesson of ["Choose with confidence", "Know what you are holding", "Cut only what you need", "Light patiently", "Slow down and notice", "Store what remains", "Handle common problems calmly", "Share the culture respectfully"]) {
    assert.match(foundations, new RegExp(lesson));
  }
  assert.match(foundations, /Strength and flavor are not the same thing/);
  assert.match(foundations, /Questions are part of the culture/);
  assert.match(foundations, /intended only for adults of legal age/);
});
