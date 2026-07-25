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
test("Cedriva 25 blends raw scores with each collector's Top 10 preference",()=>{
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
 assert.match(component,/href="\/community\?tab=ratings#top-25"/);
 assert.match(component,/aria-pressed=\{tab==="ratings"\}/);
});
test("community destinations lead to substantive, distinct content",()=>{
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.match(component,/id="recent-discussions"/);
 assert.match(component,/Questions, experience, stewardship, and cultural knowledge/);
 assert.match(component,/id="rate-a-cigar"/);
 assert.match(component,/Your score enters the ranking only after publication/);
 assert.match(component,/id="top-25"/);
 assert.match(component,/retailer promotion never does/);
});
test("Cedriva 25 is the prominent default community destination",()=>{
 const page=readFileSync(new URL("../app/community/page.tsx",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
 assert.match(page,/initialTab=\{tab==="board"\?"board":"ratings"\}/);
 assert.match(component,/className="cedriva25Metric"/);
 assert.ok(component.indexOf("cedriva25Metric")<component.indexOf("recent discussions"));
 assert.match(component,/The community benchmark/);
});
