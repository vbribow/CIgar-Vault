import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const intake = fs.readFileSync("components/photo-inventory-intake.tsx", "utf8");

test("photo-assisted drafts require a complete cigar identity before review", () => {
  assert.match(intake, /Brand, cigar line, and exact vitola are required before a draft can enter review/);
});

test("photo-assisted drafts preserve explicit zeroes and reject malformed counts", () => {
  assert.match(intake, /fullBoxRaw===""\?undefined:Number\(fullBoxRaw\)/);
  assert.match(intake, /Number\.isInteger\(value\)/);
  assert.match(intake, /Boxes and loose sticks may be 0/);
  assert.doesNotMatch(intake, /fullBoxQty:fullBoxQty\|\|undefined/);
});

test("restored photo drafts explain the browser file-security boundary", () => {
  assert.match(intake, /select the original photos again before approval/);
});
