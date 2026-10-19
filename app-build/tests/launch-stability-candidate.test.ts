import assert from "node:assert/strict";
import test from "node:test";
import { currentStabilityCandidate, currentStabilityCandidateLabel, launchStabilityObservations } from "../data/launch-stability";

test("the verified production release is frozen without inventing a stability day",()=>{
  assert.match(currentStabilityCandidate,/^[a-f0-9]{64}$/);
  assert.equal(currentStabilityCandidateLabel,"3bfa2c77 · c7f94d42d3c5");
  assert.deepEqual(launchStabilityObservations,[]);
});
