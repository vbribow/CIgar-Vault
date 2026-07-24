import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const learn = readFileSync(new URL("../app/learn/page.tsx", import.meta.url), "utf8");
const foundations = readFileSync(new URL("../app/learn/foundations/page.tsx", import.meta.url), "utf8");

test("the Curious pathway opens a dedicated beginner journey", () => {
  assert.match(learn, /"\/learn\/foundations","Begin with the essentials"/);
  assert.doesNotMatch(learn, /"Start without intimidation"[^\\n]*"\/catalog"/);
});

test("foundations teach the complete first-cigar experience in plain language", () => {
  for (const lesson of ["Choose with confidence", "Know what you are holding", "Cut only what you need", "Light patiently", "Slow down and notice", "Store what remains"]) {
    assert.match(foundations, new RegExp(lesson));
  }
  assert.match(foundations, /Strength and flavor are not the same thing/);
  assert.match(foundations, /Questions are part of the culture/);
  assert.match(foundations, /intended only for adults of legal age/);
});
