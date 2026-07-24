import assert from "node:assert/strict";
import test from "node:test";
import { CampaignInput, PartnerInput, campaignLaunchBlockers, commissionAmountCents, partnerCan, referralPath, safePartnerDestination } from "../lib/partner-model";

test("calculates percentage and fixed commissions from net revenue",()=>{
  assert.equal(commissionAmountCents(9900,"percentage",20),1980);
  assert.equal(commissionAmountCents(9900,"fixed",2500),2500);
  assert.equal(commissionAmountCents(0,"percentage",20),0);
});

test("validates reusable partner and campaign configuration",()=>{
  const partner=PartnerInput.parse({name:"Fox Cigars",slug:"fox-cigars",partnerType:"retailer",websiteUrl:"https://foxcigar.com",disclosureText:"Fox may receive compensation for eligible paid memberships."});
  assert.equal(partner.slug,"fox-cigars");
  const campaign=CampaignInput.parse({partnerId:"2544af61-5328-4a82-9780-b50c996b298f",name:"Founding launch",code:"fox-founding-launch",channel:"email",destinationPath:"/partners/join",attributionWindowDays:30,commissionType:"percentage",commissionRate:20,holdDays:30,startsAt:"2026-09-01T15:00:00.000Z",endsAt:"2026-10-01T15:00:00.000Z",termsConfirmed:true,disclosureApproved:true,audienceConsentConfirmed:true,privacyReviewed:true});
  assert.equal(campaign.attributionWindowDays,30);
});

test("keeps referral destinations first-party and paths predictable",()=>{
  assert.equal(referralPath("fox-founding-launch","https://cedriva.com"),"https://cedriva.com/r/fox-founding-launch");
  assert.equal(safePartnerDestination("//malicious.example"),"/partners/join");
  assert.equal(safePartnerDestination("/partners/join"),"/partners/join");
});

test("partner roles never receive founder approval, launch, or pause authority",()=>{
  assert.equal(partnerCan("owner","campaign.create"),true);
  assert.equal(partnerCan("owner","campaign.approve"),false);
  assert.equal(partnerCan("administrator","campaign.launch"),false);
  assert.equal(partnerCan("editor","campaign.pause"),false);
  assert.equal(partnerCan("analyst","payouts.view"),true);
});

test("launch readiness blocks locked partners and incomplete campaign safeguards",()=>{
  const blockers=campaignLaunchBlockers({partnerStatus:"draft",campaignsLocked:true,disclosureText:"",commissionRate:0,startsAt:null,endsAt:null,termsConfirmed:false,disclosureApproved:false,audienceConsentConfirmed:false,privacyReviewed:false});
  assert.ok(blockers.includes("Partner campaign creation and testing are founder-locked"));
  assert.ok(blockers.length>=8);
  assert.deepEqual(campaignLaunchBlockers({partnerStatus:"active",campaignsLocked:false,disclosureText:"Compensated partnership disclosure.",commissionRate:20,startsAt:"2026-09-01T15:00:00.000Z",endsAt:"2026-10-01T15:00:00.000Z",termsConfirmed:true,disclosureApproved:true,audienceConsentConfirmed:true,privacyReviewed:true}),[]);
});
