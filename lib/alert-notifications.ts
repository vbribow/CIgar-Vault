import { climateHealth } from "./climate-alerts";
import { loadInventory } from "./inventory";
import { getAlertDeliveries,getHumidorReadings,getHumidors,getSensors,saveAlertDelivery } from "./smartsheet";
import type { AlertDelivery } from "./types";

export function notificationConfiguration(){return{email:Boolean(process.env.RESEND_API_KEY&&process.env.ALERT_EMAIL_TO&&process.env.ALERT_EMAIL_FROM),sms:Boolean(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_FROM_NUMBER&&process.env.ALERT_SMS_TO),history:Boolean(process.env.SMARTSHEET_ALERTS_SHEET_ID)}}
async function sendEmail(subject:string,text:string,idempotencyKey:string){if(!notificationConfiguration().email)return false;const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},body:JSON.stringify({from:process.env.ALERT_EMAIL_FROM,to:[process.env.ALERT_EMAIL_TO],subject,text})});if(!response.ok)throw new Error(`Email delivery failed (${response.status})`);return true}
export async function sendAccountEmail(to:string,subject:string,text:string,idempotencyKey:string){if(!process.env.RESEND_API_KEY||!process.env.ALERT_EMAIL_FROM)return false;const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},body:JSON.stringify({from:process.env.ALERT_EMAIL_FROM,to:[to],subject,text})});if(!response.ok)throw new Error(`Email delivery failed (${response.status})`);return true}
async function sendSms(text:string){if(!notificationConfiguration().sms)return false;const account=process.env.TWILIO_ACCOUNT_SID!;const body=new URLSearchParams({To:process.env.ALERT_SMS_TO!,From:process.env.TWILIO_FROM_NUMBER!,Body:text.slice(0,1500)});const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${btoa(`${account}:${process.env.TWILIO_AUTH_TOKEN}`)}`,"Content-Type":"application/x-www-form-urlencoded"},body});if(!response.ok)throw new Error(`Text delivery failed (${response.status})`);return true}
export async function sendTestNotifications(){
  const now=new Date().toISOString(),text=`Cedriva test alert — notification delivery is working. ${now}`;
  const[emailResult,smsResult]=await Promise.allSettled([sendEmail("Cedriva test alert",text,`cigar-vault-test-${Date.now()}`),sendSms(text)]);
  return{
    email:emailResult.status==="fulfilled"&&emailResult.value,
    sms:smsResult.status==="fulfilled"&&smsResult.value,
    emailError:emailResult.status==="rejected"?(emailResult.reason instanceof Error?emailResult.reason.message:"Email delivery failed"):undefined,
    smsError:smsResult.status==="rejected"?(smsResult.reason instanceof Error?smsResult.reason.message:"Text delivery failed"):undefined,
  };
}
export function mostCompleteAlertDeliveries(deliveries:AlertDelivery[]){
  const byAlertId=new Map<string,AlertDelivery>();
  for(const delivery of deliveries){
    const current=byAlertId.get(delivery.alertId);
    if(!current){
      byAlertId.set(delivery.alertId,delivery);
      continue;
    }
    const currentChannels=Number(Boolean(current.emailSentAt))+Number(Boolean(current.smsSentAt));
    const candidateChannels=Number(Boolean(delivery.emailSentAt))+Number(Boolean(delivery.smsSentAt));
    if(candidateChannels>currentChannels||(candidateChannels===currentChannels&&delivery.detectedAt>current.detectedAt)){
      byAlertId.set(delivery.alertId,delivery);
    }
  }
  return byAlertId;
}

async function runClimateAlertNotifications(){
  const config=notificationConfiguration();
  if(!config.history||(!config.email&&!config.sms))return{enabled:false,sent:0,skipped:0,retried:0};
  const[humidors,readings,sensors,inventory,existing]=await Promise.all([
    getHumidors(),
    getHumidorReadings(),
    getSensors(),
    loadInventory(),
    getAlertDeliveries(),
  ]);
  const deliveries=mostCompleteAlertDeliveries(existing);
  let sent=0,skipped=0,retried=0;
  for(const health of humidors.map(h=>climateHealth(h,readings,sensors,inventory))){
    for(const alert of health.alerts){
      const readingKey=health.latest?.externalReadingId||health.latest?.readingId||health.latest?.recordedAt||"no-reading";
      const alertId=`ALERT-${health.humidor.humidorId}-${alert.kind}-${readingKey}`.replace(/[^A-Za-z0-9_.:-]/g,"-").slice(0,190);
      const previous=deliveries.get(alertId);
      const emailComplete=!config.email||Boolean(previous?.emailSentAt);
      const smsComplete=!config.sms||Boolean(previous?.smsSentAt);
      if(emailComplete&&smsComplete){
        skipped++;
        continue;
      }
      if(previous)retried++;
      const subject=`${alert.severity}: ${health.humidor.name} ${alert.kind.toLowerCase()} alert`;
      const text=`Cedriva ${alert.severity} alert\n${health.humidor.name}\n${alert.message}\n${alert.durationLabel||""}\n${alert.consequence||""}\nRecommended action: ${alert.guidance||"Inspect the environment and confirm the reading."}\nStored value: $${health.storedValue.toLocaleString()}\nDetected: ${alert.recordedAt||new Date().toISOString()}`;
      let emailSent=false,smsSent=false;
      const errors:string[]=[];
      if(config.email&&!previous?.emailSentAt){
        try{emailSent=await sendEmail(subject,text,alertId)}
        catch(e){errors.push(e instanceof Error?e.message:"Email failed")}
      }
      if(config.sms&&!previous?.smsSentAt){
        try{smsSent=await sendSms(text)}
        catch(e){errors.push(e instanceof Error?e.message:"SMS failed")}
      }
      const now=new Date().toISOString();
      const emailSentAt=previous?.emailSentAt||(emailSent?now:undefined);
      const smsSentAt=previous?.smsSentAt||(smsSent?now:undefined);
      const channels=[config.email,config.sms].filter(Boolean).length;
      const delivered=[config.email&&Boolean(emailSentAt),config.sms&&Boolean(smsSentAt)].filter(Boolean).length;
      const record:AlertDelivery={
        alertId,
        humidorId:health.humidor.humidorId,
        sensorId:health.sensor?.sensorId,
        severity:alert.severity,
        alertType:alert.kind,
        message:alert.message,
        readingId:health.latest?.readingId,
        detectedAt:previous?.detectedAt||now,
        emailSentAt,
        smsSentAt,
        status:delivered===channels?"Sent":delivered?"Partial":"Failed",
        notes:[alert.durationLabel,alert.consequence,alert.guidance,...errors].filter(Boolean).join("; ")||undefined,
      };
      await saveAlertDelivery(record);
      deliveries.set(alertId,record);
      sent+=emailSent||smsSent?1:0;
    }
  }
  return{enabled:true,sent,skipped,retried};
}

let activeClimateAlertRun:Promise<Awaited<ReturnType<typeof runClimateAlertNotifications>>>|undefined;

export function processClimateAlertNotifications(){
  if(activeClimateAlertRun)return activeClimateAlertRun;
  activeClimateAlertRun=runClimateAlertNotifications().finally(()=>{
    activeClimateAlertRun=undefined;
  });
  return activeClimateAlertRun;
}
