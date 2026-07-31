import assert from "node:assert/strict";
import test from "node:test";
import seed from "../data/inventory.json";
import { collectionContentsSummary, cigarInventoryRecords, isPresentationInventoryRecord } from "../lib/collection-presentation";
import { buildOwnedCollectionReconciliation } from "../lib/owned-collection-reconciliation";
import type { InventoryItem } from "../lib/types";

test("all known legacy collections reconcile into exact cigars and separate presentation assets",()=>{
  const base=seed as InventoryItem[];
  const result=buildOwnedCollectionReconciliation(base);
  const byId=new Map([...base,...result.inventory].map(item=>[item.inventoryId,item]));
  const inventory=[...byId.values()];
  assert.deepEqual(result.collections.map(item=>item.collectionId),[
    "COL-FUENTE-GRAN-FUMADA-2023",
    "COL-FUENTE-DREAM-DYNASTY",
    "COL-FUENTE-PADRON-LEGENDS",
  ]);
  for(const id of ["INV-0004","INV-0037","INV-0038"]){
    assert.equal(isPresentationInventoryRecord(byId.get(id)!,result.collections),true);
    assert.equal(cigarInventoryRecords([byId.get(id)!],result.collections).length,0);
  }
  const expected=new Map([
    ["COL-FUENTE-GRAN-FUMADA-2023",{documentedCigars:13,originalCigars:13,currentCigars:13,componentLots:13}],
    ["COL-FUENTE-DREAM-DYNASTY",{documentedCigars:22,originalCigars:22,currentCigars:22,componentLots:22}],
    ["COL-FUENTE-PADRON-LEGENDS",{documentedCigars:40,originalCigars:40,currentCigars:40,componentLots:2}],
  ]);
  for(const collection of result.collections){
    assert.deepEqual(collectionContentsSummary(collection,inventory),expected.get(collection.collectionId));
  }
});
