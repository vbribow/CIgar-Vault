import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/inventory-count/page.tsx", "utf8");
const manager = fs.readFileSync("components/inventory-count-manager.tsx", "utf8");

test("physical counting pauses when authoritative inventory is unavailable", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /Physical count protected/);
  assert.match(page, /no correction can be saved against partial data/i);
});

test("signed-in collectors can count without a founder key", () => {
  assert.match(manager, /mode === "smartsheet" && !writeKey/);
  assert.match(manager, /mode==="smartsheet"&&<label><span>Founder write key/);
});

test("counting accepts only defensible whole-number quantities and reports sync outages", () => {
  assert.match(manager, /Number\.isInteger\(fullBoxQty\)/);
  assert.match(manager, /Counts must be non-negative whole numbers/);
  assert.match(manager, /Your unsaved entries remain on this device/);
});

test("cross-device refresh cannot reinsert presentation assets into cigar counts",()=>{
  assert.match(page,/collections=\{collections\}/);
  assert.match(manager,/cigarInventoryRecords\(result\.data,collections\)/);
  assert.match(manager,/setItems\(cigars\)/);
});
