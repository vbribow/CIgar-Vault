import assert from "node:assert/strict";
import test from "node:test";
import { CampaignInput, PartnerInput, commissionAmountCents, referralPath, safePartnerDestination } from "../lib/partner-model";

test("calculates percentage and fixed commissions from net revenue",()=>{
  assert.equal(commissionAmountCents(9900,"percentage",20),1980);
  assert.equal(commissionAmountCents(9900,"fixed",2500),2500);
  assert.equal(commissionAmountCents(0,"percentage",20),0);
});

test("validates reusable partner and campaign configuration",()=>{
  const partner=PartnerInput.parse({name:"Fox Cigars",slug:"fox-cigars",partnerType:"retailer",websiteUrl:"https://foxcigar.com",disclosureText:"Fox may receive compensation for eligible paid memberships."});
  assert.equal(partner.slug,"fox-cigars");
  const campaign=CampaignInput.parse({partnerId:"2544af61-5328-4a82-9780-b50c996b298f",name:"Founding launch",code:"fox-founding-launch",channel:"email",destinationPath:"/partners/join",attributionWindowDays:30,commissionType:"percentage",commissionRate:20,holdDays:30});
  assert.equal(campaign.attributionWindowDays,30);
});

test("keeps referral destinations first-party and paths predictable",()=>{
  assert.equal(referralPath("fox-founding-launch","https://cedriva.com"),"https://cedriva.com/r/fox-founding-launch");
  assert.equal(safePartnerDestination("//malicious.example"),"/partners/join");
  assert.equal(safePartnerDestination("/partners/join"),"/partners/join");
});
