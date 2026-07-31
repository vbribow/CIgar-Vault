import assert from "node:assert/strict";
import test from "node:test";
import { retryableVisionFailure, visionFailureMessage } from "../lib/photo-identification";

test("external module failures are retried and translated for collectors",()=>{
  assert.equal(retryableVisionFailure(500,"Failed to load external module"),true);
  assert.match(visionFailureMessage("Failed to load external module"),/temporarily unavailable/i);
});

test("invalid photo requests are not retried",()=>{
  assert.equal(retryableVisionFailure(400,"Invalid image"),false);
});
