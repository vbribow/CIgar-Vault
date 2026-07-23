import assert from"node:assert/strict";import test from"node:test";import{universalSearch}from"../lib/universal-search";
const input={inventory:[{inventoryId:"INV-1",brand:"Cohiba",line:"Siglo",vitola:"IV",vintage:2025,currentQty:20,boxCode:"ABC MAY 25"}],collections:[{collectionId:"COL-1",name:"Fuente Legends",maker:"Arturo Fuente",expectedCigars:40,status:"Incomplete" as const}],valuations:[],wishlist:[]};
test("universal search finds inventory by cigar identity and box code",()=>{assert.equal(universalSearch("cohiba IV",input)[0].href,"/inventory/INV-1");assert.equal(universalSearch("ABC MAY",input)[0].kind,"Inventory")});
test("universal search finds collection and workspace destinations",()=>{assert.equal(universalSearch("Fuente Legends",input)[0].kind,"Collection");assert.ok(universalSearch("purchase advisor",input).some(result=>result.href==="/decision-center"))});
test("universal search requires a meaningful query",()=>{assert.deepEqual(universalSearch("c",input),[])});
