import assert from "node:assert/strict";
import test from "node:test";
import { currentStabilityCandidate, currentStabilityCandidateLabel, launchStabilityObservations } from "../data/launch-stability";

test("a live critical-journey defect pauses the candidate without inventing a stability day",()=>{
  assert.equal(currentStabilityCandidate,undefined);
  assert.equal(currentStabilityCandidateLabel,undefined);
  assert.deepEqual(launchStabilityObservations,[]);
});
