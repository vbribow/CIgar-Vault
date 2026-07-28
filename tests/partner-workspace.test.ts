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
import { readinessDefinitions, readinessSeedRows, readinessSummary } from "../lib/partner-readiness";
import { partnerCan } from "../lib/partner-model";

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

test("partner readiness covers trust, brand, commercial, operations, and launch controls",()=>{
  assert.equal(readinessDefinitions.length,9);
  assert.deepEqual(new Set(readinessDefinitions.map(item=>item.category)),new Set(["Trust","Brand","Commercial","Operations","Launch"]));
  assert.match(readinessDefinitions.find(item=>item.key==="privacy_data_use")?.description||"",/no access to private collector records/i);
  assert.match(readinessDefinitions.find(item=>item.key==="commission_payout")?.description||"",/Never store bank or tax credentials/i);
});

test("readiness requires every defined control before activation",()=>{
  const partnerId="2544af61-5328-4a82-9780-b50c996b298f";
  const rows=readinessSeedRows(partnerId);
  assert.deepEqual(readinessSummary(rows),{approved:0,required:9,complete:false});
  const approved=rows.map(row=>({...row,status:"approved" as const}));
  assert.deepEqual(readinessSummary(approved),{approved:9,required:9,complete:true});
  assert.equal(readinessSummary(approved.slice(0,8)).complete,false);
});

test("only operational partner roles can submit readiness evidence",()=>{
  assert.equal(partnerCan("owner","readiness.submit"),true);
  assert.equal(partnerCan("administrator","readiness.submit"),true);
  assert.equal(partnerCan("editor","readiness.submit"),true);
  assert.equal(partnerCan("analyst","readiness.submit"),false);
  assert.equal(partnerCan("viewer","readiness.submit"),false);
});

test("readiness migration creates no Fox records",async()=>{
  const migration=await readFile(
    new URL("../supabase/migrations/202607240004_partner_readiness.sql",import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(migration,/insert\s+into\s+public\.partner_readiness_items/i);
  assert.doesNotMatch(migration,/update\s+public\.partners/i);
  assert.match(migration,/Fox record remains untouched/i);
});

test("founder API enforces readiness before partner activation",async()=>{
  const route=await readFile(new URL("../app/api/partners/route.ts",import.meta.url),"utf8");
  assert.match(route,/input\.entity===["']partner["']&&input\.status===["']active["']/);
  assert.match(route,/if\(!summary\.complete\)throw new Error/);
  assert.match(route,/collaboration_locked/);
});

test("malformed invitation links return a clear public message",async()=>{
  const route=await readFile(new URL("../app/api/partner-invitations/route.ts",import.meta.url),"utf8");
  assert.match(route,/error instanceof z\.ZodError/);
  assert.match(route,/This invitation link is invalid or incomplete\./);
  assert.doesNotMatch(route,/error instanceof Error\?error\.message:"Invitation unavailable"/);
});
