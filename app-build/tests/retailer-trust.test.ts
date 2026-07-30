import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { privateOrderReference, ratingCanAffectPublicScore, retailerKey, trustedRetailerScore, type RetailerReviewEvidence } from "../lib/retailer-trust";

const review=(userId:string,overall:number):RetailerReviewEvidence=>({purchaseSessionId:"00000000-0000-0000-0000-000000000000",overall,fulfillment:overall,packaging:overall,authenticityConfidence:"High",status:"verified",userId,retailerKey:"trusted-cigars",verifiedAt:"2026-07-30"});

test("retailer ratings require a verified transaction owned by the reviewer",()=>{
  assert.equal(ratingCanAffectPublicScore({transactionStatus:"evidence_pending",transactionUserId:"u1",reviewerUserId:"u1",receiptVerifiedAt:undefined,existingReview:false}),false);
  assert.equal(ratingCanAffectPublicScore({transactionStatus:"verified",transactionUserId:"u1",reviewerUserId:"u2",receiptVerifiedAt:"2026-07-30",existingReview:false}),false);
  assert.equal(ratingCanAffectPublicScore({transactionStatus:"verified",transactionUserId:"u1",reviewerUserId:"u1",receiptVerifiedAt:"2026-07-30",existingReview:true}),false);
  assert.equal(ratingCanAffectPublicScore({transactionStatus:"verified",transactionUserId:"u1",reviewerUserId:"u1",receiptVerifiedAt:"2026-07-30",existingReview:false}),true);
});
test("one extreme review cannot swing a retailer score",()=>{
  assert.equal(trustedRetailerScore([]).score,undefined);
  assert.equal(trustedRetailerScore([review("u1",1)]).score,3.7);
  const established=trustedRetailerScore(Array.from({length:25},(_,index)=>review(`u${index}`,5)));
  assert.equal(established.confidence,"Established");
  assert.equal(established.count,25);
});
test("order references are stored as stable non-readable hashes",()=>{
  const hashed=privateOrderReference(" Order-123 ","secret","u1");
  assert.equal(hashed,privateOrderReference("order-123","secret","u1"));
  assert.notEqual(hashed,privateOrderReference("order-123","secret","u2"));
  assert.equal(hashed.includes("order"),false);
  assert.equal(hashed.length,64);
});
test("retailer keys normalize presentation differences",()=>assert.equal(retailerKey("Trusted Cígars, Inc."),"trusted-cigars-inc"));
test("retailer market migration and UI preserve transaction-only scoring",()=>{
  const migration=fs.readFileSync("supabase/migrations/202607300002_trusted_retailer_market.sql","utf8");
  const ui=fs.readFileSync("components/retailer-market.tsx","utf8");
  const inventory=fs.readFileSync("app/inventory/[inventoryId]/page.tsx","utf8");
  assert.match(migration,/purchase_session_id uuid not null unique/);
  assert.match(migration,/order_reference_hash/);
  assert.match(migration,/status in \('verified','review','hidden'\)/);
  assert.match(ui,/Only verified transactions can affect this score/);
  assert.match(ui,/Seller payment never changes ranking/);
  assert.match(inventory,/Find this cigar/);
});
