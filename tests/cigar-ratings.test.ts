import assert from "node:assert/strict";
import test from "node:test";
import { ProfessionalRatingSchema, ratingSummary } from "../lib/cigar-ratings";
const ratings=[{ratingId:"R1",inventoryId:"I1",publication:"Cigar Journal",score:94,sourceUrl:"https://example.com/1",matchConfidence:"High" as const,createdAt:"2026-07-21T00:00:00.000Z"},{ratingId:"R2",inventoryId:"I1",publication:"Cigar Aficionado",score:96,sourceUrl:"https://example.com/2",matchConfidence:"Medium" as const,createdAt:"2026-07-21T00:00:00.000Z"}];
test("professional ratings preserve source and match confidence",()=>assert.equal(ProfessionalRatingSchema.safeParse(ratings[0]).success,true));
test("rating summary separates published scores from personal scores",()=>assert.deepEqual(ratingSummary(ratings,"I1"),{count:2,highest:96,average:95,publications:2}));
