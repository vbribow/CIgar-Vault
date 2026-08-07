import assert from "node:assert/strict";
import test from "node:test";
import { exactRatingResearch, prioritizeRatingInventory, ProfessionalRatingSchema, ratingResearchHref, ratingSummary } from "../lib/cigar-ratings";
import type { InventoryItem } from "../lib/types";
const ratings=[{ratingId:"R1",inventoryId:"I1",publication:"Cigar Journal",score:94,sourceUrl:"https://example.com/1",matchConfidence:"High" as const,createdAt:"2026-07-21T00:00:00.000Z"},{ratingId:"R2",inventoryId:"I1",publication:"Cigar Aficionado",score:96,sourceUrl:"https://example.com/2",matchConfidence:"Medium" as const,createdAt:"2026-07-21T00:00:00.000Z"}];
test("professional ratings preserve source and match confidence",()=>assert.equal(ProfessionalRatingSchema.safeParse(ratings[0]).success,true));
test("rating summary separates published scores from personal scores",()=>assert.deepEqual(ratingSummary(ratings,"I1"),{count:2,highest:96,average:95,publications:2}));
test("rating links retain the exact inventory record",()=>assert.equal(ratingResearchHref("INV-0020"),"/ratings?inventoryId=INV-0020#rating-INV-0020"));
test("a requested inventory cigar is first without substituting a nearby Fuente product",()=>{
  const items=[{inventoryId:"INV-0017",brand:"Arturo Fuente",line:"Forbidden X",vitola:"Double Robusto Toy Maker"},{inventoryId:"INV-0020",brand:"Arturo Fuente",line:"ToyMaker BMF Natural",vitola:"BMF Presentation Chest — Box 1"}] as InventoryItem[];
  assert.deepEqual(prioritizeRatingInventory(items,"INV-0020").map(item=>item.inventoryId),["INV-0020","INV-0017"]);
});
test("professional rating research rejects a nearby line or vitola",()=>{
  const item={inventoryId:"INV-0020",brand:"Arturo Fuente",line:"ToyMaker BMF Natural",vitola:"BMF Presentation Chest — Box 1"} as InventoryItem;
  const result=exactRatingResearch(item,{notes:"Checked exact records.",ratings:[
    {publication:"Journal",score:95,reviewDate:"2025-01-01",reviewer:"Reviewer",sourceUrl:"https://example.com/wrong",matchConfidence:"Low",matchedVintage:null,matchedBrand:"Arturo Fuente",matchedLine:"Forbidden X",matchedVitola:"Double Robusto Toy Maker",summary:"Nearby cigar."},
    {publication:"Journal",score:94,reviewDate:"2025-01-02",reviewer:"Reviewer",sourceUrl:"https://example.com/right",matchConfidence:"High",matchedVintage:null,matchedBrand:"Arturo Fuente",matchedLine:"ToyMaker BMF Natural",matchedVitola:"BMF Presentation Chest — Box 1",summary:"Exact cigar."},
  ]});
  assert.deepEqual(result.ratings.map(rating=>rating.sourceUrl),["https://example.com/right"]);
  assert.match(result.notes,/nearby-product result was excluded/);
});
