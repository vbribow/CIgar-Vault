import test from "node:test";
import assert from "node:assert/strict";
import { CollectionInputSchema } from "../lib/collection-model";

test("collection accepts release year, presentation asset, known stick count, whole-set value, and assigned inventory",()=>{const value=CollectionInputSchema.parse({collectionId:"COL-PURPLE-DREAM",name:"Purple Dream",releaseYear:"2026",presentationInventoryId:"INV-HUMIDOR",expectedComponents:4,expectedCigars:106,wholeMarketValue:2500,status:"Complete",memberIds:["INV-1","INV-2"]});assert.equal(value.releaseYear,2026);assert.equal(value.presentationInventoryId,"INV-HUMIDOR");assert.equal(value.expectedCigars,106);assert.equal(value.wholeMarketValue,2500);assert.equal(value.memberIds.length,2);});
test("collection records complete sets separately from cigars per set",()=>{const value=CollectionInputSchema.parse({collectionId:"COL-FATHER-SON-2026",name:"Father & Son 2026",releaseYear:2026,ownedSetQty:2,expectedCigars:10,memberIds:[]});assert.equal(value.ownedSetQty,2);assert.equal(value.expectedCigars,10);});
test("collection requires a valid release year",()=>{assert.throws(()=>CollectionInputSchema.parse({collectionId:"COL-1",name:"Set",memberIds:[]}));assert.throws(()=>CollectionInputSchema.parse({collectionId:"COL-1",name:"Set",releaseYear:"unknown",memberIds:[]}));});
test("collection rejects negative market values",()=>{assert.throws(()=>CollectionInputSchema.parse({collectionId:"COL-1",name:"Set",releaseYear:2024,wholeMarketValue:-1,memberIds:[]}));});
