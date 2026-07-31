import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import test from"node:test";

const detail=readFileSync(new URL("../app/collections/[collectionId]/page.tsx",import.meta.url),"utf8");
const control=readFileSync(new URL("../components/collection-completion-control.tsx",import.meta.url),"utf8");
const valuations=readFileSync(new URL("../app/valuations/page.tsx",import.meta.url),"utf8");
const collectionsApi=readFileSync(new URL("../app/api/collections/route.ts",import.meta.url),"utf8");
const collectionsManager=readFileSync(new URL("../components/collections-manager.tsx",import.meta.url),"utf8");

test("collection detail exposes one completion engine with honest gaps",()=>{
 assert.match(detail,/CollectionCompletionControl/);
 assert.match(detail,/missingComponents=\{summary\.missingComponents\.length\}/);
 assert.match(detail,/retailMissing=\{Math\.max/);
 assert.match(detail,/identityReview=\{identityReview\}/);
});

test("completion reconciles components before reusing exact-match retail evidence",()=>{
 assert.match(control,/\/populate/);
 assert.match(control,/\/api\/retail-prices\/autofill/);
 assert.match(control,/Complete This Collection/);
 assert.match(control,/Refresh Researched Identities/);
 assert.match(control,/Finish value research/);
});

test("value completion can be scoped to a single collection",()=>{
 assert.match(valuations,/collectionId\?:string/);
 assert.match(valuations,/activeInventory\.filter\(item=>item\.collectionId===filters\.collectionId\)/);
 assert.match(valuations,/buildValuationIntelligence\(scopedInventory, valuations\)/);
 assert.match(valuations,/summarizeCollection\(scopedCollection,scopedInventory,valuations\)/);
 assert.match(valuations,/whole-set retail reference/);
 assert.match(valuations,/Component market evidence/);
 assert.match(valuations,/no whole-set premium is added to portfolio totals/);
 assert.match(valuations,/Collection completion/);
});

test("an empty duplicate collection can be removed without touching assigned cigars",()=>{
 assert.match(collectionsApi,/export async function DELETE/);
 assert.match(collectionsApi,/inventory\.some\(item=>item\.collectionId===collectionId\)/);
 assert.match(collectionsApi,/deleteOwnedRecord\("collections",collectionId\)/);
 assert.match(collectionsManager,/Remove empty duplicate/);
});
