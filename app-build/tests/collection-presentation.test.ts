import assert from "node:assert/strict";
import test from "node:test";
import {
  collectionContentsSummary,
  cigarInventoryRecords,
  inventoryCollectionRelationships,
  isPresentationInventoryMatch,
  isPresentationInventoryRecord,
} from "../lib/collection-presentation";

const purple = {
  collectionId:"COL-FUENTE-PURPLE-DREAM",
  name:"Big Purple Dream Humidor",
  releaseYear:2026,
};
const dream = {
  collectionId:"COL-FUENTE-DREAM-DYNASTY",
  name:"From Dream to Dynasty Collection",
  releaseYear:2024,
};

test("an exact Purple Dream presentation asset overrides a stale cigar-membership assignment", () => {
  const humidor = {
    inventoryId:"INV-0003",
    brand:"Arturo Fuente",
    line:"OpusX Purple Dream Humidor",
    vitola:"Numbered presentation humidor",
    currentQty:1,
    collectionId:dream.collectionId,
  };
  assert.equal(isPresentationInventoryMatch(humidor,purple),true);
  const relationship=inventoryCollectionRelationships([humidor],[dream,purple]).get(humidor.inventoryId);
  assert.equal(relationship?.kind,"presentation");
  assert.equal(relationship?.collection?.collectionId,purple.collectionId);
  assert.equal(relationship?.staleCollectionId,dream.collectionId);
});

test("a stale saved collection id alone is review data and never a displayable component link", () => {
  const item={
    inventoryId:"INV-STALE",
    brand:"Arturo Fuente",
    line:"OpusX",
    vitola:"Angel's Share",
    currentQty:1,
    collectionId:dream.collectionId,
  };
  const relationship=inventoryCollectionRelationships([item],[dream,purple]).get(item.inventoryId);
  assert.equal(relationship?.kind,"review");
  assert.equal(relationship?.collection,undefined);
});

test("a persisted presentation id survives renamed inventory display text", () => {
  const collection={...purple,presentationInventoryId:"INV-HUMIDOR"};
  const item={
    inventoryId:"INV-HUMIDOR",
    brand:"Arturo Fuente",
    line:"Collector-entered label",
    vitola:"Presentation humidor",
  };
  assert.equal(isPresentationInventoryMatch(item,collection),true);
});

test("an explicitly documented presentation humidor stays out of cigar totals while its local collection link loads", () => {
  const item={
    inventoryId:"INV-HUMIDOR",
    brand:"Arturo Fuente",
    line:"Collector-entered presentation name",
    vitola:"Numbered presentation humidor",
    currentQty:1,
  };
  assert.equal(isPresentationInventoryRecord(item,[]),true);
  assert.equal(cigarInventoryRecords([item],[]).length,0);
});

test("presentation contents report documented and current cigars without turning the humidor into a cigar lot", () => {
  const collection={...purple,expectedCigars:106};
  const component={
    inventoryId:"INV-C01",
    collectionId:purple.collectionId,
    brand:"Arturo Fuente",
    line:"OpusX Heaven and Earth",
    vitola:"Purple Rain — Lonsdale figurado (6.875 × 44)",
    originalQty:10,
    currentQty:9,
  };
  const humidor={
    inventoryId:"INV-0003",
    brand:"Arturo Fuente",
    line:"OpusX Purple Dream Humidor",
    vitola:"Numbered presentation humidor",
    currentQty:1,
  };
  assert.deepEqual(collectionContentsSummary(collection,[humidor,component]),{
    documentedCigars:106,
    originalCigars:10,
    currentCigars:9,
    componentLots:1,
  });
});

test("portfolio cigar totals exclude the presentation asset and preserve component quantity and value", () => {
  const collection={...purple,expectedCigars:106};
  const humidor={
    inventoryId:"INV-HUMIDOR",
    brand:"Arturo Fuente",
    line:"OpusX Purple Dream Humidor",
    vitola:"Numbered presentation humidor",
    currentQty:1,
    retailValue:5247,
  };
  const components=Array.from({length:11},(_,index)=>({
    inventoryId:`INV-C${index+1}`,
    collectionId:purple.collectionId,
    brand:"Arturo Fuente",
    line:"OpusX Heaven and Earth",
    vitola:index===0
      ?"Purple Rain — Lonsdale figurado (6.875 × 44)"
      :`Component ${index+1}`,
    originalQty:index===0?6:10,
    currentQty:index===0?5:10,
    retailValue:100,
  }));
  const cigars=cigarInventoryRecords([humidor,...components],[collection]);
  assert.equal(cigars.some(item=>item.inventoryId===humidor.inventoryId),false);
  assert.equal(cigars.reduce((sum,item)=>sum+(item.currentQty??0),0),105);
  assert.equal(
    cigars.reduce((sum,item)=>sum+(item.currentQty??0)*(item.retailValue??0),0),
    10500,
  );
});
