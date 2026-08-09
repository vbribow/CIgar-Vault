import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { summarizeFounderApprovals } from "../lib/founder-approval-inbox";

test("founder approval summary separates approval from publication decisions", () => {
  assert.deepEqual(summarizeFounderApprovals({
    profiles: [{status:"submitted"}],
    publications: [{status:"submitted"},{status:"submitted"},{status:"approved"},{status:"published"}],
    registryRecords: [{status:"submitted"},{status:"approved"}],
  }), {
    submittedProfiles: 1,
    submittedPublications: 2,
    submittedRegistryRecords: 1,
    publishReady: 2,
    totalNeedsApproval: 4,
  });
});

test("the normal Inbox points directly to the protected industry review desk", () => {
  const inbox = readFileSync(new URL("../components/notification-center.tsx", import.meta.url), "utf8");
  const platform = readFileSync(new URL("../components/partner-platform.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/founder-approval-inbox/route.ts", import.meta.url), "utf8");
  assert.match(inbox, /Founder approval inbox/);
  assert.match(inbox, /Review industry articles/);
  assert.match(inbox, /partner-platform#industry-review-desk/);
  assert.match(platform, /id="industry-review-desk"/);
  assert.match(platform, /readFounderSessionKey/);
  assert.match(route, /authorizeWrite/);
  assert.match(route, /industry_publications/);
});
