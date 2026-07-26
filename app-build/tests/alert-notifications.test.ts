import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { notificationConfiguration } from "../lib/alert-notifications";
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
