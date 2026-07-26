import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mostCompleteAlertDeliveries, notificationConfiguration } from "../lib/alert-notifications";
import type { AlertDelivery } from "../lib/types";
test("notification channels remain disabled without complete credentials",()=>{const keys=["RESEND_API_KEY","ALERT_EMAIL_TO","ALERT_EMAIL_FROM","TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN","TWILIO_FROM_NUMBER","ALERT_SMS_TO","SMARTSHEET_ALERTS_SHEET_ID"];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));keys.forEach(k=>delete process.env[k]);assert.deepEqual(notificationConfiguration(),{email:false,sms:false,history:false});for(const[k,v]of Object.entries(previous))if(v!==undefined)process.env[k]=v;});

test("test delivery reports email and text outcomes independently",()=>{
  const notifications=fs.readFileSync(path.join(process.cwd(),"lib/alert-notifications.ts"),"utf8");
  const panel=fs.readFileSync(path.join(process.cwd(),"components/alert-test-panel.tsx"),"utf8");
  assert.match(notifications,/Promise\.allSettled/);
  assert.match(notifications,/emailError/);
  assert.match(notifications,/smsError/);
  assert.match(panel,/emailStatus/);
  assert.match(panel,/smsStatus/);
  assert.match(panel,/aria-live="polite"/);
});

test("retry state preserves successful channels and prefers the most complete delivery",()=>{
  const base:AlertDelivery={
    alertId:"ALERT-HUM-1-Humidity-reading-1",
    humidorId:"HUM-1",
    severity:"Critical",
    alertType:"Humidity",
    message:"Humidity is out of range.",
    detectedAt:"2026-07-26T10:00:00.000Z",
    status:"Failed",
  };
  const deliveries=mostCompleteAlertDeliveries([
    base,
    {...base,emailSentAt:"2026-07-26T10:01:00.000Z",status:"Partial"},
    {...base,detectedAt:"2026-07-26T10:02:00.000Z",status:"Failed"},
  ]);
  assert.equal(deliveries.get(base.alertId)?.emailSentAt,"2026-07-26T10:01:00.000Z");

  const notifications=fs.readFileSync(path.join(process.cwd(),"lib/alert-notifications.ts"),"utf8");
  assert.match(notifications,/config\.email&&!previous\?\.emailSentAt/);
  assert.match(notifications,/config\.sms&&!previous\?\.smsSentAt/);
  assert.match(notifications,/previous\?\.emailSentAt\|\|/);
  assert.match(notifications,/previous\?\.smsSentAt\|\|/);
});
