"use client";

import { FormEvent,useState } from "react";

export function AlertTestPanel({email,sms}:{email:boolean;sms:boolean}){
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data=new FormData(event.currentTarget);
    try{
      const response=await fetch("/api/alert-notifications",{method:"POST",headers:{"Content-Type":"application/json","x-founder-key":String(data.get("writeKey")||"")},body:JSON.stringify({mode:"test"})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Test failed");
      const emailStatus=!email?"not configured":result.data.email?"sent":`failed${result.data.emailError?` — ${result.data.emailError}`:""}`;
      const smsStatus=!sms?"not configured":result.data.sms?"sent":`failed${result.data.smsError?` — ${result.data.smsError}`:""}`;
      setMessage(`Test complete — email ${emailStatus}; text ${smsStatus}.`);
    }catch(error){
      setMessage(error instanceof Error?error.message:"Test failed");
    }finally{
      setBusy(false);
    }
  }

  return <form className="alertTest" onSubmit={submit}><div><div className="eyebrow">Delivery test</div><h2>Send a test alert</h2><p>Confirm each configured channel before relying on unattended notifications.</p></div><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy||(!email&&!sms)}>{busy?"Sending…":"Send test"}</button>{message&&<output aria-live="polite">{message}</output>}</form>;
}
