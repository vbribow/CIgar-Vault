import type { CigarCollection, InventoryActivity, InventoryItem, Valuation } from "./types";
import { cigarInventoryRecords } from "./collection-presentation";

const percent = (count:number,total:number) => total ? Math.round(count / total * 100) : 100;
const releaseYear = (value:string|number|undefined) => {
  const parsed=Number(String(value??"").match(/\b(19|20)\d{2}\b/)?.[0]);
  return Number.isInteger(parsed) ? parsed : undefined;
};

export function buildLegacyRecord(inventory:InventoryItem[],collections:CigarCollection[],valuations:Valuation[],activities:InventoryActivity[]){
  const cigarInventory=cigarInventoryRecords(inventory,collections);
  const valuedIds=new Set(valuations.filter(value=>value.marketValue!==undefined||value.replacementValue!==undefined).map(value=>value.inventoryId));
  const years=cigarInventory.map(item=>releaseYear(item.vintage)).filter((value):value is number=>value!==undefined).sort((a,b)=>a-b);
  const collectionNames=new Map(collections.map(collection=>[collection.collectionId,collection.name]));
  const significant=[...cigarInventory]
    .filter(item=>item.priority==="High"||item.collectionId||item.provenanceNotes)
    .sort((a,b)=>Number(Boolean(b.provenanceNotes||b.provenanceDocumentLink))-Number(Boolean(a.provenanceNotes||a.provenanceDocumentLink))||(b.score??0)-(a.score??0))
    .slice(0,8)
    .map(item=>({...item,collectionName:item.collectionId?collectionNames.get(item.collectionId):undefined}));
  const timeline=[...activities].sort((a,b)=>b.eventDate.localeCompare(a.eventDate)).slice(0,10);
  const coverage={
    identity:percent(cigarInventory.filter(item=>item.brand&&item.line&&item.vitola).length,cigarInventory.length),
    year:percent(years.length,cigarInventory.length),
    photo:percent(cigarInventory.filter(item=>item.photoLink||item.boxPhotoLink).length,cigarInventory.length),
    provenance:percent(cigarInventory.filter(item=>item.provenanceNotes||item.provenanceDocumentLink||item.boxCode).length,cigarInventory.length),
    value:percent(cigarInventory.filter(item=>item.retailValue!==undefined||valuedIds.has(item.inventoryId)).length,cigarInventory.length),
  };
  const readiness=Math.round(Object.values(coverage).reduce((sum,value)=>sum+value,0)/Object.keys(coverage).length);
  return{coverage,readiness,earliestYear:years[0],latestYear:years.at(-1),significant,timeline,totals:{lots:cigarInventory.length,cigars:cigarInventory.reduce((sum,item)=>sum+(item.currentQty??0),0),collections:collections.length,events:activities.length}};
}
