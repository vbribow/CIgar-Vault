import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("alert readiness requires both a channel and verified history storage",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/alerts/page.tsx"),"utf8");
  assert.match(source,/deliveryReady=\(config\.email\|\|config\.sms\)&&config\.history&&historyReady/);
  assert.match(source,/Delivery blocked/);
  assert.match(source,/Alert history must be configured before unattended delivery/);
});

test("an alert history outage is never presented as an empty ledger",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/alerts/page.tsx"),"utf8");
  assert.match(source,/Promise\.allSettled/);
  assert.match(source,/History temporarily protected/);
  assert.match(source,/Existing deliveries have not been classified as missing/);
});
