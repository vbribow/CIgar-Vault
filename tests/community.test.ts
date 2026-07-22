import assert from "node:assert/strict";
import test from "node:test";
import { baselineCommunityModeration,communityCigarKey,communityTop25,type CommunityRating } from "../lib/community";

const rating=(id:string,score:number,overrides:Partial<CommunityRating>={}):CommunityRating=>({id,displayName:"Collector",brand:"Arturo Fuente",line:"OpusX",vitola:"Petite Lancero",score,review:"Excellent construction",status:"active",createdAt:"2026-07-22T00:00:00.000Z",cigarKey:"arturo-fuente|opusx|petite-lancero|",...overrides});
test("community cigar identity is stable and vintage-aware",()=>{assert.equal(communityCigarKey(rating("1",95)),"arturo-fuente|opusx|petite-lancero|");assert.notEqual(communityCigarKey(rating("1",95,{vintage:2024})),communityCigarKey(rating("1",95,{vintage:2025})))});
test("Top 25 ranks average score before rating volume",()=>{const rankings=communityTop25([rating("1",96),rating("2",94),rating("3",99,{brand:"Cohiba",line:"Siglo IV",vitola:"Marevas",cigarKey:"cohiba|siglo-iv|marevas|"})]);assert.equal(rankings[0].brand,"Cohiba");assert.equal(rankings[1].averageScore,95);assert.equal(rankings[1].ratingCount,2)});
test("hidden and review ratings never affect public rankings",()=>assert.equal(communityTop25([rating("1",100,{status:"review"}),rating("2",99,{status:"hidden"})]).length,0));
test("community safety blocks transactions and reviews contact details",()=>{assert.equal(baselineCommunityModeration("DM me to buy this box").decision,"block");assert.equal(baselineCommunityModeration("Email me for details").decision,"review");assert.equal(baselineCommunityModeration("How do you stabilize a cabinet humidor?").decision,"allow")});
