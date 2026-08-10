import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("approved intake removes the saved draft before navigating away",()=>{
  const intake=readFileSync(new URL("../components/photo-inventory-intake.tsx",import.meta.url),"utf8");
  assert.match(intake,/const remaining=queue\.filter\(entry=>!approved\.has\(entry\.draft\.inventoryId\)\)/);
  assert.match(intake,/localStorage\.setItem\(queueKey,JSON\.stringify\(remaining\)\)/);
  assert.match(intake,/localStorage\.removeItem\(workingKey\)/);
});

test("an opened record offers exact quantity editing and photo attachment",()=>{
  const page=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");
  const photos=readFileSync(new URL("../components/photo-manager.tsx",import.meta.url),"utf8");
  assert.match(page,/focus=quantity#inventory-editor/);
  assert.match(page,/Edit box or cigar quantity/);
  assert.match(page,/href="#record-photos">Add photos/);
  assert.match(photos,/id="record-photos"/);
});
