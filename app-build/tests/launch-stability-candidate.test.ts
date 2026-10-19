import assert from "node:assert/strict";
import test from "node:test";
import { currentStabilityCandidate, currentStabilityCandidateLabel, launchStabilityObservations } from "../data/launch-stability";

test("the corrected production candidate is frozen without inventing a stability day",()=>{
  assert.equal(currentStabilityCandidate,"7fecc5437937df1f83339501fa5e58079b89690ff45fa7f264dbcac24a29bd66");
  assert.equal(currentStabilityCandidateLabel,"e82bd304 · hojavia-beta-shell-v4-c1704144324d");
  assert.deepEqual(launchStabilityObservations,[]);
});
