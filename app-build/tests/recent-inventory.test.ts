import assert from "node:assert/strict";
import test from "node:test";
import { recentlyAddedInventory } from "../lib/recent-inventory";
import type { InventoryItem } from "../lib/types";

const item=(inventoryId:string,addedAt?:string):InventoryItem=>({inventoryId,brand:"Brand",line:"Line",vitola:"Toro",addedAt});

test("recent inventory uses trusted creation times and returns only five",()=>{
  const result=recentlyAddedInventory([
    item("old","2026-01-01T00:00:00.000Z"),item("bad","unknown"),item("none"),
    ...Array.from({length:6},(_,index)=>item(`new-${index}`,`2026-08-0${index+1}T00:00:00.000Z`)),
  ]);
  assert.deepEqual(result.map(value=>value.inventoryId),["new-5","new-4","new-3","new-2","new-1"]);
});
