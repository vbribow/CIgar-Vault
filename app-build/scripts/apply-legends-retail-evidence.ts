import { loadInventory } from "../lib/inventory";
import { loadPreviewCollections, savePreviewCollection } from "../lib/preview-collections";
import { savePreviewInventoryOverrides } from "../lib/preview-inventory";
import { savePreviewValuation } from "../lib/preview-valuations";
import type { Valuation } from "../lib/types";

const evidenceDate="2026-07-28";
const source="Holt’s Cigar Company exact Fuente y Padrón Legends listing";
const sourceUrl="https://www.holts.com/cigars/all-cigar-brands/fuente-y-padron-legends.html";
const unitPrice=178;
const inventoryIds=["INV-0039","INV-0040"];

const [inventory,collections]=await Promise.all([loadInventory(),loadPreviewCollections()]);
const items=inventoryIds.map(inventoryId=>{
  const item=inventory.find(candidate=>candidate.inventoryId===inventoryId);
  if(!item)throw new Error(`Missing Legends component ${inventoryId}`);
  return{...item,retailValue:unitPrice};
});
await savePreviewInventoryOverrides(items);

for(const item of items){
  const valuation:Valuation={
    valuationId:`VAL-RETAIL-LEGENDS-${item.inventoryId}-${evidenceDate}`,
    inventoryId:item.inventoryId,
    valuationDate:evidenceDate,
    replacementValue:unitPrice,
    marketEvidenceType:"Insufficient evidence",
    source,
    sourceUrl,
    confidence:"Medium",
    notes:"Exact single-cigar retail listing at $178, corroborated by separate exact listings at $180 and $198. Retail replacement only; no completed sale or aftermarket value is claimed.",
  };
  await savePreviewValuation(valuation);
}

const legends=collections.find(item=>item.collectionId==="COL-FUENTE-PADRON-LEGENDS");
if(!legends)throw new Error("Missing Fuente & Padrón Legends collection");
await savePreviewCollection({
  ...legends,
  wholeMarketValue:7115,
  valuationDate:evidenceDate,
  valuationSource:`${source} · 40-cigar complete box listing`,
  valuationSourceUrl:sourceUrl,
  notes:`${legends.notes||""} Whole-set reference is a retailer listing, not a completed resale. It remains separate from component cigar value.`,
});

console.log(JSON.stringify({updated:inventoryIds,unitPrice,wholeSetReference:7115,sourceUrl},null,2));
