import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a single approved photo-intake lot opens its exact saved record",()=>{
  const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/if\(approved\.length===1\)\{window\.location\.assign\(`\/inventory\/\$\{encodeURIComponent\(saved\.inventoryId\)\}\?saved=inventory`\);return\}/);
  assert.match(manager,/if\(!saved\)return/);
});
