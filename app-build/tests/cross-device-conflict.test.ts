import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { recordRevision } from "../lib/record-revision";

test("record revision is stable across property order and changes with collector data", () => {
  const left = { inventoryId: "INV-QA", brand: "Hojavía", currentQty: 8, nested: { b: 2, a: 1 } };
  const same = { nested: { a: 1, b: 2 }, currentQty: 8, brand: "Hojavía", inventoryId: "INV-QA" };
  assert.equal(recordRevision(left), recordRevision(same));
  assert.notEqual(recordRevision(left), recordRevision({ ...left, currentQty: 7 }));
  assert.doesNotMatch(recordRevision(left), /Hojavía|INV-QA|8/);
});

test("all collector inventory editors send change tokens", async () => {
  for (const file of [
    "../components/inventory-manager.tsx",
    "../components/inventory-count-manager.tsx",
    "../components/inventory-correction-assistant.tsx",
    "../components/recommendation-fact-editor.tsx",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /"If-Match": recordRevision\(/);
  }
});

test("collection facts and membership corrections reject stale device state", async () => {
  const collectionManager = await readFile(new URL("../components/collections-manager.tsx", import.meta.url), "utf8");
  const collectionRoute = await readFile(new URL("../app/api/collections/route.ts", import.meta.url), "utf8");
  const assignmentReview = await readFile(new URL("../components/collection-assignment-review.tsx", import.meta.url), "utf8");
  const memberRoute = await readFile(new URL("../app/api/collections/[collectionId]/members/route.ts", import.meta.url), "utf8");
  assert.match(collectionManager, /"If-Match":collectionRevision\(editing,inventory\)/);
  assert.match(collectionRoute, /collectionRevision\(existingCollection,inventory\)/);
  assert.match(collectionRoute, /changed on another device/);
  assert.match(assignmentReview, /"If-Match":recordRevision\(item\)/);
  assert.match(memberRoute, /saveOwnedRecordIfUnchanged/);
  assert.match(memberRoute, /newer record was preserved/);
});

test("inventory and photo saves reject stale records instead of overwriting them", async () => {
  const inventoryRoute = await readFile(new URL("../app/api/inventory/[inventoryId]/route.ts", import.meta.url), "utf8");
  const photoRoute = await readFile(new URL("../app/api/inventory/[inventoryId]/photos/route.ts", import.meta.url), "utf8");
  const ownedRecords = await readFile(new URL("../lib/user-data.ts", import.meta.url), "utf8");
  assert.match(inventoryRoute, /status: 409/);
  assert.match(inventoryRoute, /saveOwnedRecordIfUnchanged/);
  assert.match(photoRoute, /saveOwnedRecordIfUnchanged/);
  assert.match(photoRoute, /newer record was preserved/);
  assert.match(ownedRecords, /\.eq\("updated_at", current\.updated_at\)/);
});
