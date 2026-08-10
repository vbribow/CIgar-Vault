import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path:string) => readFileSync(new URL(path, root), "utf8");

test("high-use collector workflows avoid internal product terminology", () => {
  const inventory = read("components/inventory-manager.tsx");
  const intake = read("components/photo-inventory-intake.tsx");
  const verification = read("app/verification/page.tsx");
  const collection = read("app/collections/[collectionId]/page.tsx");

  for (const [surface, source] of [["inventory",inventory],["photo intake",intake],["verification",verification],["collection",collection]] as const) {
    assert.doesNotMatch(source, /Safe inventory intake|Saved review queue|Private evidence ledger|Release-aware physical-lot audit|Collection trust audit|Verified owned components/, `${surface} contains retired technical copy`);
  }
  assert.match(inventory, /Purchase and ownership history/);
  assert.match(intake, /Add .*selected cigar.* to my Vault/);
  assert.match(verification, /Keep every useful check in one place/);
  assert.match(collection, /What still needs attention/);
});

test("the practice walkthrough explains the task without software vocabulary", () => {
  const walkthrough = read("components/collector-walkthrough.tsx");
  assert.doesNotMatch(walkthrough, /Synthetic demonstration only|Portable sample record|conclusion boundary|public\/private classifications|evidence ledger/);
  assert.match(walkthrough, /Missing or conflicting information stays visible instead of becoming a guess/);
});
