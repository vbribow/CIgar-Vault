import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("humidor detail does not treat unknown quantity or value as zero",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/humidors/[humidorId]/page.tsx"),"utf8");
  assert.match(source,/quantityKnown/);
  assert.match(source,/valueComplete/);
  assert.match(source,/At least/);
  assert.match(source,/Valuation pending/);
  assert.match(source,/documented/);
  assert.doesNotMatch(source,/\(i\.retailValue \|\| 0\) \* \(i\.currentQty \|\| 0\)/);
});
