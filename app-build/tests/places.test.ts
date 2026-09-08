import assert from"node:assert/strict";import{readFileSync}from"node:fs";import test from"node:test";import{communityPlaceRankingScore,communityPlaceScore,PlaceCertificationInput,PlaceReviewInput,rankPlaces,vibeConsensus,weightedGoogleScore,type PlaceReview}from"../lib/places";
import{normalizePlaceSearch}from"../lib/place-search";
import{placeSearchDailyLimit,placeSearchQueryHash,placeSearchReservationDecision}from"../lib/place-search-guard";
test("quick community ratings require only identity, visit, and score",()=>{const value=PlaceReviewInput.parse({googlePlaceId:"PLACE-1",displayName:"Brian",score:94,visitDate:"2026-07-24"});assert.deepEqual(value.vibes,[]);assert.equal(value.review,"");assert.throws(()=>PlaceReviewInput.parse({...value,vibes:["Relaxed","Upscale","Traditional","Professional"]}))});
test("community score and vibe consensus remain separate from Google",()=>{const reviews=[{score:90,vibes:["Relaxed","Upscale"]},{score:96,vibes:["Relaxed","Collector-focused"]}] satisfies Array<Pick<PlaceReview,"score"|"vibes">>;assert.equal(communityPlaceScore(reviews),93);assert.deepEqual(vibeConsensus(reviews),[{vibe:"Relaxed",count:2},{vibe:"Collector-focused",count:1},{vibe:"Upscale",count:1}])});
test("Google ranking is review-count weighted instead of trusting a tiny five-star sample",()=>{assert.ok(weightedGoogleScore(4.8,800)>weightedGoogleScore(5,2));const ranked=rankPlaces([{googlePlaceId:"SMALL",name:"Small",address:"",googleMapsUri:"https://maps.example/s",googleRating:5,googleReviewCount:2,communityReviewCount:0},{googlePlaceId:"PROVEN",name:"Proven",address:"",googleMapsUri:"https://maps.example/p",googleRating:4.8,googleReviewCount:800,communityReviewCount:0}]);assert.equal(ranked[0].googlePlaceId,"PROVEN")});
test("Hojavía lounge ranking rewards credible samples instead of one perfect visit",()=>{assert.ok(communityPlaceRankingScore(92,40)!>communityPlaceRankingScore(100,1)!);const ranked=rankPlaces([{googlePlaceId:"ONE",name:"One",address:"",googleMapsUri:"https://maps.example/one",communityScore:100,communityReviewCount:1},{googlePlaceId:"MANY",name:"Many",address:"",googleMapsUri:"https://maps.example/many",communityScore:92,communityReviewCount:40}]);assert.equal(ranked[0].googlePlaceId,"MANY")});
test("certification is dated, revisitable, and independently disclosed",()=>{const value=PlaceCertificationInput.parse({googlePlaceId:"PLACE-1",level:"Three Leaves",score:96,visitMonth:"2026-07",summary:"An exceptional destination with rigorous humidor care and genuine hospitality.",strengths:"Deep selection and knowledgeable service.",complimentaryDisclosure:"Nothing complimentary.",nextReviewDate:"2027-07-01"});assert.equal(value.level,"Three Leaves")});
test("live ZIP discovery is authenticated and never exposes credential names",()=>{
 const route=readFileSync(new URL("../app/api/places/search/route.ts",import.meta.url),"utf8");
 assert.match(route,/auth\.getUser\(\)/);
 assert.match(route,/Sign in to search nearby cigar places/);
 assert.match(route,/LIVE_DISCOVERY_UNAVAILABLE/);
 assert.doesNotMatch(route,/error:.*GOOGLE_PLACES_API_KEY/);
});
test("lounge discovery accepts ZIP codes and explicit city-state searches",()=>{
 assert.equal(normalizePlaceSearch("99501"),"99501");
 assert.equal(normalizePlaceSearch("St. Louis, MO"),"St. Louis, MO");
 assert.equal(normalizePlaceSearch("Anchorage, Alaska"),"Anchorage, Alaska");
 assert.equal(normalizePlaceSearch("Anchorage"),undefined);
 assert.equal(normalizePlaceSearch("995"),undefined);
});
test("live lounge discovery is explicitly activated, bounded, and one-call per search",()=>{
 const route=readFileSync(new URL("../app/api/places/search/route.ts",import.meta.url),"utf8");
 assert.match(route,/GOOGLE_PLACES_SEARCH_ENABLED!=="true"/);
 assert.match(route,/reservePlaceSearch\(db,user\.id,location\)/);
 assert.match(route,/cigar lounge, cigar bar, or cigar shop near/);
 assert.doesNotMatch(route,/Promise\.all\(\["cigar lounge","cigar bar","cigar shop"\]/);
 assert.equal(placeSearchDailyLimit({} as NodeJS.ProcessEnv),20);
 assert.equal(placeSearchDailyLimit({GOOGLE_PLACES_DAILY_USER_LIMIT:"500"} as unknown as NodeJS.ProcessEnv),100);
 assert.equal(placeSearchQueryHash(" Anchorage,  AK "),placeSearchQueryHash("anchorage, ak"));
});
test("live discovery survives intentionally unprovisioned optional community tables",()=>{
 const route=readFileSync(new URL("../app/api/places/search/route.ts",import.meta.url),"utf8");
 assert.match(route,/optionalPlaceTableMissing/);
 assert.match(route,/PGRST205/);
 assert.match(route,/place_reviews/);
 assert.match(route,/place_certifications/);
 assert.match(route,/reviewRows\.error&&!optionalPlaceTableMissing/);
 assert.match(route,/certRows\.error&&!optionalPlaceTableMissing/);
});
test("concurrent duplicate and over-limit lounge searches fail closed",()=>{
 const now=new Date("2026-09-08T12:00:00Z"),hash=placeSearchQueryHash("99501");
 const rows=[{id:1,created_at:"2026-09-08T11:59:40Z",properties:{queryHash:hash,status:"reserved"}},{id:2,created_at:"2026-09-08T12:00:00Z",properties:{queryHash:hash,status:"reserved"}}];
 assert.equal(placeSearchReservationDecision(rows,2,hash,20,now),"duplicate");
 const unique=Array.from({length:21},(_,index)=>({id:index+1,created_at:"2026-09-08T12:00:00Z",properties:{queryHash:String(index),status:"reserved"}}));
 assert.equal(placeSearchReservationDecision(unique,20,"19",20,now),"allowed");
 assert.equal(placeSearchReservationDecision(unique,21,"20",20,now),"daily_limit");
});
