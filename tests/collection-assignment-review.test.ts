import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import test from"node:test";

test("collection correction removes only the parent link and preserves inventory",()=>{
 const route=readFileSync(new URL("../app/api/collections/[collectionId]/members/route.ts",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/collection-assignment-review.tsx",import.meta.url),"utf8");
 assert.match(route,/collectionId:undefined/);
 assert.doesNotMatch(route,/deleteOwnedRecord/);
 assert.match(component,/remain in main inventory/);
 assert.match(component,/Remove collection link/);
});

test("collection population refuses a mismatched researched edition",()=>{
 const route=readFileSync(new URL("../app/api/collections/[collectionId]/populate/route.ts",import.meta.url),"utf8");
 assert.match(route,/collectionEditionIssue/);
 assert.match(route,/must be corrected before population/);
});
