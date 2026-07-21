import test from "node:test";
import assert from "node:assert/strict";
import { CollectionInputSchema } from "../lib/collection-model";

test("collection accepts whole-set value and assigned inventory",()=>{const value=CollectionInputSchema.parse({collectionId:"COL-PURPLE-DREAM",name:"Purple Dream",expectedComponents:4,wholeMarketValue:2500,status:"Complete",memberIds:["INV-1","INV-2"]});assert.equal(value.wholeMarketValue,2500);assert.equal(value.memberIds.length,2);});
test("collection rejects negative market values",()=>{assert.throws(()=>CollectionInputSchema.parse({collectionId:"COL-1",name:"Set",wholeMarketValue:-1,memberIds:[]}));});
