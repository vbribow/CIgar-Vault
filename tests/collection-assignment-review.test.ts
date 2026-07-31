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

test("collection population uses exact researched component matching",()=>{
 const route=readFileSync(new URL("../app/api/collections/[collectionId]/populate/route.ts",import.meta.url),"utf8");
 assert.match(route,/collectionRequirementMatches\(collection, eligibleInventory\)/);
 assert.match(route,/auditCollectionTemplateProtocol\(template\)/);
 assert.match(route,/readyForInventoryAutomation/);
 assert.doesNotMatch(route,/matchCollectionRequirements\(template\.requirements/);
});

test("legacy reconciliation is presented as a non-destructive repair",()=>{
 const detail=readFileSync(new URL("../app/collections/[collectionId]/page.tsx",import.meta.url),"utf8");
 const control=readFileSync(new URL("../components/collection-populate-button.tsx",import.meta.url),"utf8");
 assert.match(detail,/repairableMembers=reviewMembers\.filter\(item=>item\.notes\?\.includes\("Expected component:"\)\)/);
 assert.match(detail,/correctionCount=\{repairableMembers\.length\}/);
 assert.match(control,/Nothing will be deleted/);
 assert.match(control,/Collector quantities and independent lots are preserved/);
});
