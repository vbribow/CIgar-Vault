import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the exact saved record shows a clear mobile-safe confirmation",()=>{
  const page=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");
  const styles=readFileSync(new URL("../app/styles.css",import.meta.url),"utf8");
  const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");
  assert.match(page,/query\.saved==="inventory"/);
  assert.match(page,/Saved to your private Vault/);
  assert.match(page,/This is the exact record that was saved/);
  assert.match(manager,/setMessage\(""\);\s*setRecentlySaved/);
  assert.doesNotMatch(manager,/was saved to your private Vault\. Choose what to do next below/);
  assert.match(styles,/\.inventorySavedConfirmation/);
  assert.match(styles,/\.inventorySaveToast\{left:16px;right:16px;bottom:calc\(92px \+ env\(safe-area-inset-bottom\)\)/);
});
