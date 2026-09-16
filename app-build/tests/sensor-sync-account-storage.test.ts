import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route=readFileSync(new URL("../app/api/sensor-sync/route.ts",import.meta.url),"utf8");

test("signed-in SensorPush sync stays in the collector's private account store",()=>{
  assert.match(route,/accountDataMode\(\)==="supabase"/);
  assert.match(route,/accountOwned\?await loadSensors\(\):await getSensors\(\)/);
  assert.match(route,/await loadHumidorReadings\(\)/);
  assert.match(route,/!accountOwned&&!authorizeSensorSync\(request\)/);
  assert.match(route,/saveOwnedRecordsAtomically\(\[/);
  assert.match(route,/kind:"readings" as const/);
  assert.match(route,/kind:"sensors" as const/);
});
test("signed-in collectors can start SensorPush sync without a founder key",()=>{
  const panel=readFileSync(new URL("../components/sensor-sync-panel.tsx",import.meta.url),"utf8");
  const page=readFileSync(new URL("../app/sensors/page.tsx",import.meta.url),"utf8");
  assert.match(panel,/!accountOwned&&<label>/);
  assert.match(page,/accountOwned=\{mode === "supabase"\}/);
});

test("legacy scheduled sync retains its isolated Smartsheet path",()=>{
  assert.match(route,/await ingestSensorReadings\(result\.readings\)/);
  assert.match(route,/for\(const sensor of updatedSensors\)await saveSensor\(sensor\)/);
});
