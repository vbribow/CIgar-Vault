"use client";
import { FormEvent,useState } from "react";

type Props={configured:boolean;linkedSensors:number;scheduleReady:boolean;accountOwned:boolean;syncOverdue:boolean;lastSuccessfulSync?:string};

export function SensorSyncPanel({configured,linkedSensors,scheduleReady,accountOwned,syncOverdue,lastSuccessfulSync}:Props){
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  async function sync(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setMessage("");
    try{
      const form=new FormData(event.currentTarget);
      const response=await fetch("/api/sensor-sync",{method:"POST",headers:{"x-founder-key":String(form.get("writeKey")||"")}});
      const result=await response.json();
      if(!response.ok){setMessage(result.error?`SensorPush could not update: ${result.error}`:"SensorPush could not update. Your saved readings are unchanged; try again.");return}
      setMessage(`Sync complete: ${result.data.imported} new readings, ${result.data.duplicates} already recorded. ${result.data.message||""}`);
      window.setTimeout(()=>window.location.reload(),900);
    }catch{setMessage("The SensorPush connection was interrupted. Your saved readings are unchanged; try again.")}
    finally{setBusy(false)}
  }
  return <section className="syncCenter" aria-labelledby="sync-center-title">
    <div className="syncCenterHead"><div><div className="eyebrow">Automatic synchronization</div><h2 id="sync-center-title">SensorPush cloud connection</h2><p>Readings pass through one secure server connection and enter the same climate history as Tempi imports.</p><small>{lastSuccessfulSync?`Last successful reading: ${new Date(lastSuccessfulSync).toLocaleString()}`:"No successful cloud reading has been received yet."}</small></div><span className={`syncReadiness ${configured&&linkedSensors&&!syncOverdue?"ready":"setup"}`}>{!configured||!linkedSensors?"Setup required":syncOverdue?"Sync overdue":"Connected"}</span></div>
    <div className="syncSteps"><article className={configured?"complete":""}><strong>1</strong><span>Cloud credentials</span><small>{configured?"Stored securely on the server":"Add SensorPush email and password to the environment"}</small></article><article className={linkedSensors?"complete":""}><strong>2</strong><span>Device mapping</span><small>{linkedSensors?`${linkedSensors} SensorPush device${linkedSensors===1?"":"s"} linked`:"Register the sensor and copy its SensorPush device ID"}</small></article><article className={scheduleReady&&!syncOverdue?"complete":""}><strong>3</strong><span>Hourly schedule</span><small>{!scheduleReady?"Add the scheduler secret before enabling unattended sync":syncOverdue?"Configured, but no current reading has arrived":"Current readings confirm the schedule is working"}</small></article><article><strong>4</strong><span>Independent devices</span><small>One delayed sensor does not hide current readings from the others</small></article></div>
    <form className="syncAction" onSubmit={sync}><div><strong>{syncOverdue?"Retry synchronization":"Test the connection"}</strong><span>{syncOverdue?"Saved history is safe. Retry now while the hourly schedule continues in the background.":"Run a secure sync now before relying on the hourly schedule."}</span></div>{!accountOwned&&<label><span>Founder write key</span><input name="writeKey" type="password" required/></label>}<button className="button" disabled={busy||!configured||!linkedSensors}>{busy?"Synchronizing…":syncOverdue?"Retry SensorPush sync":"Sync SensorPush now"}</button></form>
    {message&&<output className="syncMessage" aria-live="polite">{message}</output>}
    <div className="syncFoot"><span>Tempi</span><b>CSV active · automatic gateway/mobile bridge planned</b><span>Govee</span><b>Adapter planned</b></div>
  </section>
}
