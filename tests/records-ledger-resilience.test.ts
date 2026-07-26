import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const records = fs.readFileSync("app/records/page.tsx", "utf8");
const activity = fs.readFileSync("app/activity/page.tsx", "utf8");

test("journal entry pauses rather than loading partial inventory history", () => {
  assert.match(records, /Journal records protected/);
  assert.match(records, /Promise\.allSettled/);
  assert.match(records, /no quantity-changing entry can be made against a partial record/i);
});

test("activity ledger pauses rather than writing against partial history", () => {
  assert.match(activity, /Activity ledger protected/);
  assert.match(activity, /Promise\.allSettled/);
  assert.match(activity, /no quantity-changing transaction can be written against a partial record/i);
});
