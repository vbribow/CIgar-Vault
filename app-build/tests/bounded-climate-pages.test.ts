import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pages=[
  "app/page.tsx",
  "app/briefing/page.tsx",
  "app/humidors/page.tsx",
  "app/humidors/[humidorId]/page.tsx",
  "app/intelligence/page.tsx",
  "app/inventory/[inventoryId]/page.tsx",
  "app/reports/page.tsx",
  "app/sensors/page.tsx",
  "app/system-health/page.tsx",
];

test("collector dashboards never load the complete high-volume climate archive",()=>{
  for(const file of pages){
    const source=readFileSync(new URL(`../${file}`,import.meta.url),"utf8");
    assert.match(source,/loadRecentHumidorReadings/,file);
    assert.doesNotMatch(source,/\bloadHumidorReadings\b/,file);
  }
});

test("bounded climate loading remains owner scoped, recent first, and capped",()=>{
  const source=readFileSync(new URL("../lib/user-data.ts",import.meta.url),"utf8");
  assert.match(source,/loadRecentAccountRecords/);
  assert.match(source,/\.eq\("user_id",context\.user\.id\)\.eq\("kind",kind\)/);
  assert.match(source,/order\("updated_at",\{ascending:false\}\)/);
  assert.match(source,/Math\.min\(10_000/);
});
