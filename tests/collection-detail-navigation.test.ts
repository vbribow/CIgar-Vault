import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("collection detail keeps inventory and collection return paths outside the hidden local nav",()=>{
  const page=fs.readFileSync(path.join(process.cwd(),"app/collections/[collectionId]/page.tsx"),"utf8");
  const css=fs.readFileSync(path.join(process.cwd(),"app/collections/[collectionId]/detail.css"),"utf8");
  assert.ok((page.match(/className="collectionBreadcrumbs"/g)??[]).length>=2);
  assert.match(page,/href="\/inventory">← Back to Inventory/);
  assert.match(page,/href="\/collections">All Collections/);
  assert.match(css,/\.collectionBreadcrumbs/);
  assert.match(css,/position:sticky/);
});
