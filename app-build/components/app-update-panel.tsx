"use client";

import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import styles from "./app-update-panel.module.css";

type ReleaseState={current?:string;latest?:string;checking:boolean;message:string};

function releaseLabel(value?:string){
  if(!value)return"Not confirmed";
  const token=value.split("-").at(-1);
  return token&&token!=="__HOJAVIA_RELEASE__"?token.slice(0,8):"Development preview";
}

async function activeRelease(registration:ServiceWorkerRegistration){
  const worker=registration.active||navigator.serviceWorker.controller;
  if(!worker)return undefined;
  return new Promise<string|undefined>(resolve=>{
    const channel=new MessageChannel();
    const finish=(value?:string)=>{channel.port1.close();resolve(value)};
    const timer=window.setTimeout(()=>finish(),1200);
    channel.port1.onmessage=event=>{window.clearTimeout(timer);finish(typeof event.data?.release==="string"?event.data.release:undefined)};
    worker.postMessage({type:"GET_RELEASE"},[channel.port2]);
  });
}

async function latestRelease(){
  const response=await fetch(`/release.json?check=${Date.now()}`,{cache:"no-store"});
  if(!response.ok)return undefined;
  const value=await response.json().catch(()=>({}));
  return typeof value.release==="string"?value.release:undefined;
}

export function AppUpdatePanel(){
  const[state,setState]=useState<ReleaseState>({checking:true,message:"Confirming this app version…"});

  async function inspect(requestUpdate=false){
    if(!("serviceWorker"in navigator)){
      setState({checking:false,message:"This browser does not provide installed-app update status. Your private records are unaffected."});
      return;
    }
    setState(current=>({...current,checking:true,message:requestUpdate?"Checking for a newer private app…":"Confirming this app version…"}));
    try{
      const registration=await navigator.serviceWorker.getRegistration();
      if(requestUpdate&&registration)await registration.update();
      const[current,latest]=await Promise.all([registration?activeRelease(registration):undefined,latestRelease()]);
      const message=!current
        ?"The installed version could not be confirmed. No collection records were classified as changed or missing."
        :!latest
          ?"The latest available version could not be confirmed. Keep using the app and check again when connected."
          :current===latest
            ?`You’re using the latest ${brand.name} experience.`
            :`A newer ${brand.name} experience is available. The app will reload safely when its update finishes.`;
      setState({current,latest,checking:false,message});
    }catch{
      setState(current=>({...current,checking:false,message:"The update check could not finish. Your private records remain intact; try again when connected."}));
    }
  }

  useEffect(()=>{void inspect()},[]);

  return <section className={`card ${styles.card}`} aria-labelledby="app-update-title">
    <div><div className="eyebrow">Installed app</div><h2 id="app-update-title">Version & updates</h2><p>Confirm the phone experience without guessing or reinstalling. Checking does not alter collection records.</p></div>
    <div className={styles.status}><div><span>Installed version</span><strong>{releaseLabel(state.current)}</strong></div><div><span>Latest available</span><strong>{releaseLabel(state.latest)}</strong></div><output aria-live="polite">{state.message}</output></div>
    <div className={styles.actions}><button type="button" className="button secondary" disabled={state.checking} onClick={()=>void inspect(true)}>{state.checking?"Checking…":"Check for updates"}</button></div>
  </section>;
}
