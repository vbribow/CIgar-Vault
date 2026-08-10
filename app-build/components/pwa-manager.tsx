"use client";
import { useEffect,useState } from "react";
import { HojaviaMark } from "@/components/hojavia-mark";
import { brand } from "@/lib/brand";
import { isActiveProductHostname,isPrivatePreviewHostname } from "@/lib/preview-host";
export type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const productionHost="hojavia.com";
const installDismissedKey="hojavia:pwa-dismissed:v1";
export function PwaManager({ initialEvent }: { initialEvent?: InstallEvent }){
  const[event,setEvent]=useState<InstallEvent|undefined>(initialEvent),[showIos,setShowIos]=useState(false),[hidden,setHidden]=useState(true),[waiting,setWaiting]=useState<ServiceWorker>(),[legacyHost,setLegacyHost]=useState(""),[installing,setInstalling]=useState(false),[installError,setInstallError]=useState("");
  useEffect(()=>{
    const installStandalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone;
    if(!isActiveProductHostname(window.location.hostname)&&(!isPrivatePreviewHostname(window.location.hostname)||installStandalone))setLegacyHost(window.location.host);
    let registration:ServiceWorkerRegistration|undefined;
    let reloadingForUpdate=false;
    const controllerChange=()=>{
      if(reloadingForUpdate)return;
      reloadingForUpdate=true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);
    if("serviceWorker"in navigator)void navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(value=>{
      registration=value;
      void value.update().catch(()=>{/* The installed shell remains usable if an update check fails. */});
      if(value.waiting)setWaiting(value.waiting);
      value.addEventListener("updatefound",()=>{const worker=value.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setWaiting(worker)})});
    }).catch(()=>{/* Service-worker support must never prevent the app from opening. */});
    const refreshUpdate=()=>{if(document.visibilityState==="visible")void registration?.update().catch(()=>{/* Keep the current shell when an update check cannot connect. */})};
    document.addEventListener("visibilitychange",refreshUpdate);
    window.addEventListener("online",refreshUpdate);
    let installDismissed=false;
    try{installDismissed=localStorage.getItem(installDismissedKey)==="1"}catch{/* Storage may be unavailable in a private or restricted web view. */}
    if(!installStandalone&&!installDismissed){setHidden(false);setShowIos(/iphone|ipad|ipod/i.test(navigator.userAgent))}
    const listener=(value:Event)=>{value.preventDefault();setEvent(value as InstallEvent);setInstallError("")};
    const installed=()=>{setEvent(undefined);setHidden(true);setInstalling(false)};
    window.addEventListener("beforeinstallprompt",listener);
    window.addEventListener("appinstalled",installed);
    const timer=window.setInterval(()=>void registration?.update(),15*60_000);
    return()=>{window.removeEventListener("beforeinstallprompt",listener);window.removeEventListener("appinstalled",installed);document.removeEventListener("visibilitychange",refreshUpdate);window.removeEventListener("online",refreshUpdate);navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange);window.clearInterval(timer)};
  },[]);
  function dismiss(){try{localStorage.setItem(installDismissedKey,"1")}catch{/* Dismiss for this session even when storage is unavailable. */}setHidden(true)}
  async function install(){
    if(!event||installing)return;
    setInstalling(true);
    setInstallError("");
    try{
      await event.prompt();
      const choice=await event.userChoice;
      setEvent(undefined);
      if(choice.outcome==="accepted")setHidden(true);
      else setInstallError("Installation was not completed. Use your browser menu and choose Add to Home Screen when you are ready.");
    }catch{
      setEvent(undefined);
      setInstallError("The installation window could not open. Use your browser menu and choose Add to Home Screen.");
    }finally{
      setInstalling(false);
    }
  }
  if(legacyHost)return <aside className="installPrompt updatePrompt" aria-live="polite"><span className="appBrandMark">!</span><div><strong>Older {brand.name} address</strong><small>{legacyHost} is separate from the current app and may not show current records.</small></div><a href={`https://${productionHost}/`}>Reinstall safely</a></aside>;
  if(waiting)return <aside className="installPrompt updatePrompt" aria-live="polite">{!brand.isPreview&&<HojaviaMark/>}<div><strong>{brand.name} update ready</strong><small>Your private records remain intact. Updating reloads the app shell and applies the latest experience.</small></div><button onClick={()=>waiting.postMessage({type:"SKIP_WAITING"})}>Install update</button></aside>;
  if(hidden||(!event&&!showIos))return null;
  return <aside className="installPrompt" aria-live="polite">{!brand.isPreview&&<HojaviaMark/>}<div><strong>Keep {brand.name} on your phone</strong><small>{installError||(showIos?"Use your browser’s Share menu, then choose Add to Home Screen.":"Install the app shell for faster return access. Private collection pages are not stored for offline viewing.")}</small></div>{event&&<button onClick={install} disabled={installing}>{installing?"Opening…":"Install"}</button>}<a href="/install">Installation help</a><button className="installDismiss" onClick={dismiss} aria-label="Dismiss install suggestion">×</button></aside>;
}
