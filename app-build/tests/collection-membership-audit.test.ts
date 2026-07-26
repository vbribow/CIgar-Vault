import assert from "node:assert/strict";
import test from "node:test";
import { auditCollectionMembership } from "../lib/collection-membership-audit";
import type { CigarCollection, InventoryItem } from "../lib/types";

const collection: CigarCollection = {
  collectionId: "COL-FUENTE-PADRON-LEGENDS",
  name: "Fuente & Padrón Legends",
  releaseYear: 2022,
};

const component: InventoryItem = {
  inventoryId: "INV-FUENTE-PADRON-LEGENDS-C01",
  collectionId: collection.collectionId,
  brand: "Padrón",
  line: "Legends Carlos A. Fuente, Sr.",
  vitola: "Box-pressed Churchill (7 × 50)",
  currentQty: 20,
};

test("keeps a verified component distinct from its standalone identity", () => {
    const standalone: InventoryItem = {
      ...component,
      inventoryId: "INV-STANDALONE",
      collectionId: undefined,
      currentQty: 2,
    };
    const audit = auditCollectionMembership(
      [component, standalone],
      [collection],
    );
    assert.deepEqual(audit.rows.map((row) => row.classification), ["Both", "Both"]);
    assert.equal(audit.rows.every((row) => row.issues.length === 0), true);
});

test("flags a collection link that is not a documented component", () => {
    const wrong: InventoryItem = {
      inventoryId: "INV-WRONG",
      collectionId: collection.collectionId,
      brand: "Trinidad",
      line: "Vigía",
      vitola: "Vigía",
      currentQty: 11,
    };
    const audit = auditCollectionMembership([wrong], [collection]);
    assert.equal(audit.rows[0].classification, "Review");
    assert.ok(audit.rows[0].issues.includes("Unverified collection assignment"));
});

test("never treats a missing collection record as proof of membership", () => {
    const orphan: InventoryItem = {
      ...component,
      inventoryId: "INV-ORPHAN",
      collectionId: "COL-MISSING",
    };
    const audit = auditCollectionMembership([orphan], []);
    assert.equal(audit.rows[0].classification, "Review");
    assert.ok(audit.rows[0].issues.includes("Missing collection record"));
});

test("separates collection release year from a generated cigar year", () => {
    const inherited: InventoryItem = {
      ...component,
      vintage: 2022,
      notes: "Expected component: 20 Legends cigars",
    };
    const audit = auditCollectionMembership([inherited], [collection]);
    assert.ok(audit.rows[0].issues.includes("Possible inherited collection year"));
});

test("flags a cigar documented after the collection edition", () => {
  const laterRelease: InventoryItem = {
    ...component,
    vintage: 2026,
  };
  const audit = auditCollectionMembership([laterRelease], [collection]);
  assert.equal(audit.rows[0].classification, "Review");
  assert.ok(audit.rows[0].issues.includes("Cigar release is later than collection"));
});
