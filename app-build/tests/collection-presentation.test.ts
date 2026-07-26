import assert from "node:assert/strict";
import test from "node:test";
import {
  inventoryCollectionRelationships,
  isPresentationInventoryMatch,
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
