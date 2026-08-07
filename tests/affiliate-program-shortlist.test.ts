import assert from "node:assert/strict";
import test from "node:test";
import {
  affiliateProgramShortlist,
  affiliateResearchWatchlist,
  affiliateShortlistNotice,
  shortlistResearchAudit,
} from "../lib/affiliate-program-shortlist";

test("shortlist remains research-only and inactive", () => {
  assert.deepEqual(affiliateShortlistNotice, {
    applicationSubmitted: false,
    outreachSent: false,
    trackingConfigured: false,
    programActivated: false,
  });
});

test("verified candidates use official HTTPS program sources and complete scores", () => {
  assert.ok(affiliateProgramShortlist.length >= 3);
  for (const candidate of affiliateProgramShortlist) {
    assert.equal(candidate.status, "public-program-verified");
    assert.match(candidate.programUrl ?? "", /^https:\/\/www\./);
    assert.equal(
      candidate.score,
      candidate.collectorFit +
        candidate.credibility +
        candidate.transparency +
        candidate.technicalFit +
        candidate.complianceFit,
    );
    assert.ok(candidate.openQuestions.length > 0);
  }
});

test("unknown commercial terms remain explicit rather than inferred", () => {
  const jr = affiliateProgramShortlist.find(candidate => candidate.retailerName === "JR Cigars");
  assert.equal(jr?.commission, "Not publicly stated");
  assert.equal(jr?.referralWindow, "Not publicly stated");
});

test("Fox remains locked with no program or application path", () => {
  const fox = affiliateResearchWatchlist.find(candidate => candidate.retailerName === "Fox Cigar");
  assert.equal(fox?.status, "locked");
  assert.equal(fox?.programUrl, null);
  assert.match(fox?.restriction ?? "", /separate explicit approval/i);
  assert.equal(shortlistResearchAudit().foxLocked, true);
});
