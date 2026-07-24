import assert from "node:assert/strict";
import test from "node:test";
import { inferSommCollectionId, rankCollectionSommCandidates } from "../lib/collection-somm";
import type { InventoryItem, SmokingLog } from "../lib/types";

const padron: InventoryItem = { inventoryId:"LEGENDS-P",collectionId:"LEGENDS",brand:"Padrón",line:"Legends Carlos A. Fuente, Sr.",vitola:"Box-pressed Churchill (7 × 50)",currentQty:20 };
const fuente: InventoryItem = { inventoryId:"LEGENDS-F",collectionId:"LEGENDS",brand:"Arturo Fuente",line:"Legends José O. Padrón",vitola:"Round Churchill (7 × 50)",currentQty:20 };

test("collection pairing keeps each cigar identity separate and favors exact personal evidence",()=>{
 const smoke:SmokingLog={smokeId:"S1",inventoryId:fuente.inventoryId,dateSmoked:"2026-07-20",overall:94};
 const ranked=rankCollectionSommCandidates([padron,fuente],[smoke],new Date("2026-07-24T00:00:00Z"));
 assert.equal(ranked[0].item.inventoryId,fuente.inventoryId);
 assert.equal(ranked[0].evidence,"Recent personal tasting");
 assert.match(ranked[0].detail,/94\/100/);
 assert.equal(ranked[1].evidence,"Readiness unknown");
});

test("collection pairing does not invent a smoke-now leader without evidence",()=>{
 const ranked=rankCollectionSommCandidates([padron,fuente],[],new Date("2026-07-24T00:00:00Z"));
 assert.ok(ranked.every(candidate=>candidate.evidence==="Readiness unknown"));
 assert.ok(ranked.every(candidate=>candidate.detail.includes("will not invent")));
});

test("Cigar Somm never infers collection mode from a cigar identity or generated inventory id",()=>{
 const collections=[{collectionId:"COL-FUENTE-PADRON-LEGENDS",name:"Fuente & Padrón Legends",releaseYear:2022,memberIds:[]}];
 assert.equal(inferSommCollectionId({...padron,inventoryId:"INV-FUENTE-PADRON-LEGENDS-C01"},collections),"");
 assert.equal(inferSommCollectionId({...padron,collectionId:undefined,inventoryId:"SINGLE-LEGENDS-CIGAR"},collections),"");
});
