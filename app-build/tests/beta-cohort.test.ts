import assert from "node:assert/strict";
import test from "node:test";
import { assertBetaSeatAvailable, betaCohortSize, betaSeatsRemaining, FOUNDER_BETA_SEAT_LIMIT } from "../lib/beta-cohort";

test("every invited or active tester consumes one founder seat", () => {
  const collectors = [
    { stage:"Prospect" },
    { stage:"Invited" },
    { stage:"Signed up" },
    { stage:"Imported" },
    { stage:"Activated" },
  ];
  assert.equal(betaCohortSize(collectors), 4);
  assert.equal(betaSeatsRemaining(collectors), FOUNDER_BETA_SEAT_LIMIT - 4);
});

test("prospects remain available when the founder cohort is full", () => {
  const full = Array.from({ length:FOUNDER_BETA_SEAT_LIMIT }, (_, index) => ({ id:String(index), stage:"Invited" }));
  assert.doesNotThrow(() => assertBetaSeatAvailable(full, { stage:"Prospect" }));
  assert.throws(() => assertBetaSeatAvailable(full, { stage:"Invited" }), /founder cohort is full/i);
});

test("updating an existing cohort member does not consume a second seat", () => {
  const full = Array.from({ length:FOUNDER_BETA_SEAT_LIMIT }, (_, index) => ({ id:String(index), stage:"Invited" }));
  assert.doesNotThrow(() => assertBetaSeatAvailable(full, { id:"0", stage:"Signed up" }));
});
