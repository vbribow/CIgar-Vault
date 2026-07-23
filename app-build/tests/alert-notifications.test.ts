import test from "node:test";
import assert from "node:assert/strict";
import { notificationConfiguration } from "../lib/alert-notifications";
test("notification channels remain disabled without complete credentials",()=>{const keys=["RESEND_API_KEY","ALERT_EMAIL_TO","ALERT_EMAIL_FROM","TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN","TWILIO_FROM_NUMBER","ALERT_SMS_TO","SMARTSHEET_ALERTS_SHEET_ID"];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));keys.forEach(k=>delete process.env[k]);assert.deepEqual(notificationConfiguration(),{email:false,sms:false,history:false});for(const[k,v]of Object.entries(previous))if(v!==undefined)process.env[k]=v;});
