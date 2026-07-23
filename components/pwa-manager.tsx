"use client";
import { useEffect,useState } from "react";
import { CedrivaMark } from "@/components/cedriva-mark";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const productionHost="c-igar-vault-lmug.vercel.app";
export function PwaManager(){
  const[event,setEvent]=useState<InstallEvent>(),[showIos,setShowIos]=useState(false),[hidden,setHidden]=useState(true),[waiting,setWaiting]=useState<ServiceWorker>(),[legacyHost,setLegacyHost]=useState("");
  useEffect(()=>{
    if(window.location.host!==productionHost&&!window.location.hostname.includes("localhost"))setLegacyHost(window.location.host);
    let registration:ServiceWorkerRegistration|undefined;
    const controllerChange=()=>window.location.reload();
    navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);
    if("serviceWorker"in navigator)void navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(value=>{registration=value;void value.update();if(value.waiting)setWaiting(value.waiting);value.addEventListener("updatefound",()=>{const worker=value.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setWaiting(worker)})})});
    const standalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone;
    if(!standalone&&localStorage.getItem("cigar-vault:pwa-dismissed")!=="1"){setHidden(false);setShowIos(/iphone|ipad|ipod/i.test(navigator.userAgent))}
    const listener=(value:Event)=>{value.preventDefault();setEvent(value as InstallEvent)};
    window.addEventListener("beforeinstallprompt",listener);
    const timer=window.setInterval(()=>void registration?.update(),15*60_000);
    return()=>{window.removeEventListener("beforeinstallprompt",listener);navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange);window.clearInterval(timer)};
  },[]);
  function dismiss(){localStorage.setItem("cigar-vault:pwa-dismissed","1");setHidden(true)}
  async function install(){if(!event)return;await event.prompt();const choice=await event.userChoice;if(choice.outcome==="accepted")setHidden(true)}
  if(legacyHost)return <aside className="installPrompt updatePrompt"><span className="appBrandMark">!</span><div><strong>Old Cedriva installation</strong><small>{legacyHost} does not synchronize with the production app.</small></div><a href={`https://${productionHost}/`}>Open production</a></aside>;
  if(waiting)return <aside className="installPrompt updatePrompt"><CedrivaMark/><div><strong>Cedriva update ready</strong><small>Install the current photo and synchronization fixes.</small></div><button onClick={()=>waiting.postMessage({type:"SKIP_WAITING"})}>Update now</button></aside>;
  if(hidden||(!event&&!showIos))return null;
  return <aside className="installPrompt"><CedrivaMark/><div><strong>Keep Cedriva on your phone</strong><small>{showIos?"Tap Share, then Add to Home Screen.":"Install the mobile app experience."}</small></div>{event&&<button onClick={install}>Install</button>}<button className="installDismiss" onClick={dismiss} aria-label="Dismiss install suggestion">×</button></aside>;
}
