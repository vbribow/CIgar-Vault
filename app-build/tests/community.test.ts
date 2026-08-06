import assert from "node:assert/strict";
import test from "node:test";
import { baselineCommunityModeration,communityCigarKey,communityPersonalTop10,communityStatusLabel,communityTop25,type CommunityRating } from "../lib/community";
import { readFileSync } from "node:fs";

const rating=(id:string,score:number,overrides:Partial<CommunityRating>={}):CommunityRating=>({id,displayName:"Collector",brand:"Arturo Fuente",line:"OpusX",vitola:"Petite Lancero",score,review:"Excellent construction",status:"active",createdAt:"2026-07-22T00:00:00.000Z",cigarKey:"arturo-fuente|opusx|petite-lancero|",...overrides});
test("community cigar identity is stable and vintage-aware",()=>{assert.equal(communityCigarKey(rating("1",95)),"arturo-fuente|opusx|petite-lancero|");assert.notEqual(communityCigarKey(rating("1",95,{vintage:2024})),communityCigarKey(rating("1",95,{vintage:2025})))});
test("each collector receives a personal Top 10 from published scores",()=>{
 const ratings=Array.from({length:12},(_,index)=>rating(String(index),80+index,{userId:"collector-1",line:`Line ${index}`,cigarKey:`cigar-${index}`}));
 const rankings=communityPersonalTop10(ratings);
 assert.equal(rankings.length,10);
 assert.equal(rankings[0].averageScore,91);
 assert.equal(rankings[9].averageScore,82);
});
test("Collector 25 blends raw scores with each collector's Top 10 preference",()=>{
 const rankings=communityTop25([
  rating("1",96,{userId:"collector-1"}),
  rating("2",94,{userId:"collector-2"}),
  rating("3",99,{userId:"collector-1",brand:"Cohiba",line:"Siglo IV",vitola:"Marevas",cigarKey:"cohiba|siglo-iv|marevas|"})
 ]);
 assert.equal(rankings[0].brand,"Cohiba");
 assert.equal(rankings[1].averageScore,95);
 assert.equal(rankings[1].weightedScore,95.9);
 assert.equal(rankings[1].ratingCount,2);
});
test("Collector 25 counts only the latest valid score from each collector and cigar",()=>{
 const rankings=communityTop25([
  rating("old",100,{userId:"collector-1",createdAt:"2026-01-01T00:00:00.000Z"}),
  rating("new",90,{userId:"collector-1",createdAt:"2026-07-01T00:00:00.000Z"}),
  rating("invalid",101,{userId:"collector-2"})
 ]);
 assert.equal(rankings.length,1);
 assert.equal(rankings[0].averageScore,90);
 assert.equal(rankings[0].ratingCount,1);
 assert.equal(rankings[0].confidence,"provisional");
});
test("personal preference weight grows only as a collector's list matures",()=>{
 const newCollector=communityTop25([rating("one",60,{userId:"new-collector"})])[0];
 const matureRatings=Array.from({length:10},(_,index)=>rating(`m${index}`,60-index,{userId:"mature-collector",line:`Line ${index}`,cigarKey:`cigar-${index}`}));
 const matureCollector=communityTop25(matureRatings).find(item=>item.line==="Line 0");
 assert.ok(newCollector.weightedScore<61);
 assert.ok(matureCollector);
 assert.equal(matureCollector.averageScore,60);
});
test("hidden and review ratings never affect public rankings",()=>assert.equal(communityTop25([rating("1",100,{status:"review"}),rating("2",99,{status:"hidden"})]).length,0));
test("community safety blocks transactions and reviews contact details",()=>{assert.equal(baselineCommunityModeration("DM me to buy this box").decision,"block");assert.equal(baselineCommunityModeration("Email me for details").decision,"review");assert.equal(baselineCommunityModeration("How do you stabilize a cabinet humidor?").decision,"allow")});
test("reviewed contributions explain where founder moderation happens",()=>assert.match(readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8"),/AI Administrator review queue/));
test("contributors can track publication status and founder correction notes",()=>{
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 const route=readFileSync(new URL("../app/api/community/route.ts",import.meta.url),"utf8");
 assert.equal(communityStatusLabel("active"),"Published");
 assert.equal(communityStatusLabel("review"),"Under Review");
 assert.equal(communityStatusLabel("changes"),"Needs Changes");
 assert.match(component,/Your contributions/);
 assert.match(component,/Founder notes appear here/);
 assert.match(route,/myContributions/);
 assert.match(route,/eq\("user_id",userId\)/);
});
test("founder moderation supports publish, requested changes, and non-publication",()=>{
 const route=readFileSync(new URL("../app/api/ai-administrator/route.ts",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/ai-administrator.tsx",import.meta.url),"utf8");
 const migration=readFileSync(new URL("../supabase/migrations/202607240001_community_contribution_status.sql",import.meta.url),"utf8");
 assert.match(route,/z\.enum\(\["active","changes","hidden"\]\)/);
 assert.match(route,/Tell the contributor what needs to change/);
 assert.match(component,/Approve & publish/);
 assert.match(component,/Request changes/);
 assert.match(component,/Founder note/);
 assert.match(migration,/'active','review','changes','hidden'/);
});
test("community activity metrics are real accessible navigation controls",()=>{
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.match(component,/function showTab\(next:"board"\|"ratings"\)/);
 assert.match(component,/aria-label=\{`View \$\{data\.posts\.length\} recent discussions`\}/);
 assert.match(component,/aria-label=\{`View \$\{data\.ratingCount\} collector ratings`\}/);
 assert.match(component,/href="\/community\?tab=board#recent-discussions"/);
 assert.match(component,/href="\/community\?tab=ratings#rate-a-cigar"/);
 assert.doesNotMatch(component,/aria-pressed=\{tab==="ratings"\}/);
});
test("community destinations lead to substantive, distinct content",()=>{
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.match(component,/id="recent-discussions"/);
 assert.match(component,/Questions, experience, stewardship, and cultural knowledge/);
 assert.match(component,/id="rate-a-cigar"/);
 assert.match(component,/No re-entry is needed/);
 assert.match(component,/id="top-25"/);
 assert.match(component,/Rated by smokers\. Updated by experience\./);
 assert.match(component,/living ranking shaped by what/);
 assert.match(component,/evolves as the community’s experiences change/);
 assert.match(component,/one rating cannot imply broad consensus/);
});
test("Collector 25 is the prominent default community destination",()=>{
 const page=readFileSync(new URL("../app/community/page.tsx",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.match(page,/initialTab=\{tab==="board"\?"board":"ratings"\}/);
 assert.match(page,/className="hojavia25Hero"/);
 assert.match(page,/href="\/community\?tab=ratings#top-25"/);
 assert.match(page,/The community benchmark/);
 assert.doesNotMatch(component,/cedriva25Metric/);
 assert.match(page,/The \{brand\.labels\.community\}/);
 assert.match(page,/brand\.labels\.communityRanking/);
});
test("age and marketplace notice appears with message-board participation",()=>{
 const page=readFileSync(new URL("../app/community/page.tsx",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(page,/21\+ collector community/);
 assert.match(component,/communityAgeNotice/);
 assert.match(component,/21\+ collector community/);
 assert.match(component,/Marketplace transactions are not permitted/);
});
test("collectors can delete only their own message-board posts with confirmation",()=>{
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 const route=readFileSync(new URL("../app/api/community/route.ts",import.meta.url),"utf8");
 assert.match(component,/Delete my post/);
 assert.match(component,/This permanently removes your discussion/);
 assert.match(component,/method:"DELETE"/);
 assert.match(component,/myContributions\.posts\.some\(owned=>owned\.id===item\.id\)/);
 assert.match(component,/item\.kind==="Discussion"&&postDeleteControls\(item\.id\)/);
 assert.match(route,/export async function DELETE/);
 assert.match(route,/\.eq\("id",id\)\.eq\("user_id",user\.id\)/);
 assert.match(route,/belongs to another collector/);
});
