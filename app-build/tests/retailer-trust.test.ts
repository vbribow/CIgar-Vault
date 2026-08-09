import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { foxLaunchPlacementWeight, listingMatchesExactIdentity, privateOrderReference, rankRetailerListings, ratingCanAffectPublicScore, retailerKey, RetailerListingSchema, trustedRetailerScore, type RetailerReviewEvidence } from "../lib/retailer-trust";

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
test("one frequent buyer cannot dominate a retailer score",()=>{
  const one=trustedRetailerScore([review("u1",5)]);
  const repeated=trustedRetailerScore(Array.from({length:20},()=>review("u1",5)));
  assert.equal(repeated.score,one.score);
  assert.equal(repeated.count,20);
  assert.equal(repeated.reviewerCount,1);
  assert.equal(repeated.confidence,"Early evidence");
});
test("certified retailer evidence exposes weighted service dimensions and authenticity signals",()=>{
  const summary=trustedRetailerScore([
    {...review("u1",5),fulfillment:4,packaging:3,authenticityConfidence:"High"},
    {...review("u2",3),fulfillment:2,packaging:4,authenticityConfidence:"Concern"},
  ]);
  assert.equal(summary.dimensions.overall,4);
  assert.equal(summary.dimensions.fulfillment,3.8);
  assert.equal(summary.dimensions.packaging,3.9);
  assert.deepEqual(summary.dimensions.authenticity,{High:1,Medium:0,Concern:1});
  assert.equal(trustedRetailerScore([]).confidence,"Not yet established");
});
test("retailer results pass an exact HTTPS identity gate",()=>{
  const item={brand:"Arturo Fuente",line:"Don Carlos",vitola:"Double Robusto"};
  assert.equal(listingMatchesExactIdentity(item,{title:"Arturo Fuente Don Carlos Double Robusto",url:"https://example.com/cigar"}),true);
  assert.equal(listingMatchesExactIdentity(item,{title:"Arturo Fuente Don Carlos Lancero",url:"https://example.com/cigar"}),false);
  assert.equal(listingMatchesExactIdentity(item,{title:"Arturo Fuente Don Carlos Double Robusto",url:"http://example.com/cigar"}),false);
  assert.equal(RetailerListingSchema.safeParse({seller:"Seller",sellerType:"Authorized retailer",title:"Exact cigar",url:"http://example.com",availability:"In stock",notes:""}).success,false);
});
test("order references are stored as stable non-readable hashes",()=>{
  const hashed=privateOrderReference(" Order-123 ","secret","u1");
  assert.equal(hashed,privateOrderReference("order-123","secret","u1"));
  assert.notEqual(hashed,privateOrderReference("order-123","secret","u2"));
  assert.equal(hashed.includes("order"),false);
  assert.equal(hashed.length,64);
});
test("retailer keys normalize presentation differences",()=>assert.equal(retailerKey("Trusted Cígars, Inc."),"trusted-cigars-inc"));
test("Fox receives a transparent launch prior that fully yields to performance",()=>{
  const listings=[
    {seller:"Other Cigars",availability:"In stock",unitPrice:12},
    {seller:"Fox Cigar",availability:"In stock",unitPrice:14},
  ];
  assert.equal(rankRetailerListings(listings,{}).at(0)?.seller,"Fox Cigar");
  assert.equal(foxLaunchPlacementWeight(0),30);
  assert.equal(foxLaunchPlacementWeight(12),0);
  const ratings={
    "fox-cigar":trustedRetailerScore(Array.from({length:12},(_,index)=>review(`f${index}`,2))),
    "other-cigars":trustedRetailerScore(Array.from({length:12},(_,index)=>review(`o${index}`,5))),
  };
  assert.equal(rankRetailerListings(listings,ratings).at(0)?.seller,"Other Cigars");
});
test("availability outranks a launch relationship",()=>{
  const ranked=rankRetailerListings([{seller:"Fox Cigar",availability:"Waitlist"},{seller:"Available Retailer",availability:"In stock"}],{});
  assert.equal(ranked.at(0)?.seller,"Available Retailer");
});
test("retailer market preserves verified scoring while mobile commerce fails closed",()=>{
  const migration=fs.readFileSync("supabase/migrations/202607300002_trusted_retailer_market.sql","utf8");
  const ui=fs.readFileSync("components/retailer-market.tsx","utf8");
  const inventory=fs.readFileSync("app/inventory/[inventoryId]/availability/page.tsx","utf8");
  const clickRoute=fs.readFileSync("app/api/retailer-market/click/route.ts","utf8");
  const purchaseRoute=fs.readFileSync("app/api/retailer-market/purchases/route.ts","utf8");
  const availability=fs.readFileSync("lib/retailer-availability.ts","utf8");
  const clickMigration=fs.readFileSync("supabase/migrations/202607300003_retailer_click_idempotency.sql","utf8");
  assert.match(migration,/purchase_session_id uuid not null unique/);
  assert.match(migration,/order_reference_hash/);
  assert.match(migration,/status in \('verified','review','hidden'\)/);
  assert.match(ui,/Verified purchases only/);
  assert.match(ui,/Affiliate compensation never changes this score or search ranking/);
  assert.match(ui,/Not yet established/);
  assert.match(ui,/Fulfillment/);
  assert.match(ui,/no retailer purchase link or affiliate tracking/i);
  assert.match(inventory,/<RetailerMarket item=\{item\}/);
  assert.match(clickRoute,/status: 410/);
  assert.match(clickRoute,/Retailer purchase links are web-only/);
  assert.doesNotMatch(clickRoute,/outboundUrl|listing_fingerprint|trackingStatus/);
  assert.match(purchaseRoute,/reviewed:reviewed\.has/);
  assert.match(availability,/listingMatchesExactIdentity/);
  assert.match(clickMigration,/unique index[\s\S]*user_id, listing_fingerprint[\s\S]*status = 'clicked'/);
});
