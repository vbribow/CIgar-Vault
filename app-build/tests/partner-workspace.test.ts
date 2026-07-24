import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildWorkspaceMetrics,
  createInvitationToken,
  hashInvitationToken,
  invitationExpired,
  invitationExpiresAt,
} from "../lib/partner-workspace";

test("creates one-time invitation tokens that are stored only as hashes",()=>{
  const invitation=createInvitationToken();
  assert.notEqual(invitation.token,invitation.hash);
  assert.equal(invitation.hash,hashInvitationToken(invitation.token));
  assert.equal(invitation.hash.length,64);
});

test("expires invitations at the requested boundary",()=>{
  const now=Date.parse("2026-07-24T12:00:00.000Z");
  const expiresAt=invitationExpiresAt(7,now);
  assert.equal(expiresAt,"2026-07-31T12:00:00.000Z");
  assert.equal(invitationExpired(expiresAt,now),false);
  assert.equal(invitationExpired(expiresAt,Date.parse(expiresAt)),true);
});

test("workspace metrics remain organization-scoped and aggregate-only",()=>{
  const metrics=buildWorkspaceMetrics(["campaign-a"],{
    clicks:[{campaign_id:"campaign-a"},{campaign_id:"campaign-b"}],
    attributions:[{campaign_id:"campaign-a"},{campaign_id:"campaign-a"},{campaign_id:"campaign-b"}],
    conversions:[
      {campaign_id:"campaign-a",net_revenue_cents:10_000,status:"confirmed"},
      {campaign_id:"campaign-a",net_revenue_cents:5_000,status:"refunded"},
      {campaign_id:"campaign-b",net_revenue_cents:90_000,status:"confirmed"},
    ],
    commissions:[
      {campaign_id:"campaign-a",amount_cents:2_000,status:"pending"},
      {campaign_id:"campaign-a",amount_cents:500,status:"void"},
      {campaign_id:"campaign-b",amount_cents:18_000,status:"pending"},
    ],
  });

  assert.deepEqual(metrics,{
    clicks:1,
    attributedCollectors:2,
    paidConversions:1,
    netRevenueCents:10_000,
    commissionCents:2_000,
  });
  const serialized=JSON.stringify(metrics);
  assert.equal(serialized.includes("email"),false);
  assert.equal(serialized.includes("user_id"),false);
});

test("Fox collaboration remains explicitly locked in the workspace migration",async()=>{
  const migration=await readFile(
    new URL("../supabase/migrations/202607240003_partner_workspaces.sql",import.meta.url),
    "utf8",
  );
  assert.match(migration,/slug='fox-cigars'/);
  assert.match(migration,/collaboration_locked=true/);
  assert.match(migration,/no Fox invitations, workspace access, collaboration activity, trials, or tests/i);
});

test("partner workspace exposes no founder approval or launch controls",async()=>{
  const component=await readFile(
    new URL("../components/partner-workspace.tsx",import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(component,/action:\s*["']approveCampaign["']/);
  assert.doesNotMatch(component,/action:\s*["']launchCampaign["']/);
  assert.doesNotMatch(component,/action:\s*["']pauseCampaign["']/);
});
