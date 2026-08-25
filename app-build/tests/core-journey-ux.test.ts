import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the four core collector journeys share clear save and recovery contracts", () => {
  const inventory = read("../components/inventory-manager.tsx");
  const smoke = read("../components/records-manager.tsx");
  const photo = read("../components/photo-inventory-intake.tsx");
  const collections = read("../components/collections-manager.tsx");
  const collectionDetail = read("../app/collections/[collectionId]/page.tsx");

  assert.match(inventory, /inventoryForm coreJourney/);
  assert.match(inventory, /aria-busy=\{saving\}/);
  assert.match(inventory, /Saving to my Vault…/);
  assert.match(inventory, /journeyFeedback/);
  assert.match(inventory, /window\.location\.assign\(`\/inventory\/\$\{encodeURIComponent\(savedId\)\}\?saved=inventory`\)/);

  assert.match(smoke, /smokeJournal coreJourney/);
  assert.match(smoke, /one clear save/);
  assert.match(smoke, /Log another/);
  assert.match(smoke, /Open cigar record/);

  assert.match(photo, /photoIntake card coreJourney/);
  assert.match(photo, /Enter another cigar/);
  assert.match(photo, /Return to Vault/);

  assert.match(collections, /collectionEditor coreJourney/);
  assert.match(collections, /aria-busy=\{saving\}/);
  assert.match(collections, /Saving collection…/);
  assert.match(collections, /finally\{setSaving\(false\);saveInFlight\.current=false;\}/);
  assert.doesNotMatch(collections, /setMessage\(savedMessage\);\s*window\.location\.reload\(\)/);
  assert.match(collections, /\?saved=collection/);
  assert.match(collectionDetail, /Collection saved\./);
  assert.match(collectionDetail, /exact collection that was changed/);
  assert.match(collectionDetail, /Add another collection/);
});
