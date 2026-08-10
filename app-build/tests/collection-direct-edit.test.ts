import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");

test("collection detail opens the exact record editor",()=>{
  const detail=fs.readFileSync(path.join(root,"app/collections/[collectionId]/page.tsx"),"utf8");
  const page=fs.readFileSync(path.join(root,"app/collections/page.tsx"),"utf8");
  const manager=fs.readFileSync(path.join(root,"components/collections-manager.tsx"),"utf8");
  assert.match(detail,/\/collections\?edit=\$\{encodeURIComponent\(collection\.collectionId\)\}#collection-editor/);
  assert.match(page,/initialEditId=\{edit\}/);
  assert.match(manager,/collection\.collectionId===initialEditId/);
  assert.match(manager,/Edit all collection details|Complete sets owned/);
});
