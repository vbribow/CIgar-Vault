"use client";
import { useEffect,useState } from "react";
import { CedrivaMark } from "@/components/cedriva-mark";
import { brand } from "@/lib/brand";
import { isPrivatePreviewHostname } from "@/lib/preview-host";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const productionHost="c-igar-vault-lmug.vercel.app";
const installDismissedKey="cedriva:pwa-dismissed:v4";
export function PwaManager(){
  const[event,setEvent]=useState<InstallEvent>(),[showIos,setShowIos]=useState(false),[hidden,setHidden]=useState(true),[waiting,setWaiting]=useState<ServiceWorker>(),[legacyHost,setLegacyHost]=useState(""),[installing,setInstalling]=useState(false),[installError,setInstallError]=useState("");
  useEffect(()=>{
    if(window.location.host!==productionHost&&!isPrivatePreviewHostname(window.location.hostname))setLegacyHost(window.location.host);
    let registration:ServiceWorkerRegistration|undefined;
    const controllerChange=()=>window.location.reload();
    navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);
    if("serviceWorker"in navigator)void navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(value=>{registration=value;void value.update();if(value.waiting)setWaiting(value.waiting);value.addEventListener("updatefound",()=>{const worker=value.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setWaiting(worker)})})});
    const standalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone;
    if(!standalone&&localStorage.getItem(installDismissedKey)!=="1"){setHidden(false);setShowIos(/iphone|ipad|ipod/i.test(navigator.userAgent))}
    const listener=(value:Event)=>{value.preventDefault();setEvent(value as InstallEvent);setInstallError("")};
    const installed=()=>{setEvent(undefined);setHidden(true);setInstalling(false)};
    window.addEventListener("beforeinstallprompt",listener);
    window.addEventListener("appinstalled",installed);
    const timer=window.setInterval(()=>void registration?.update(),15*60_000);
    return()=>{window.removeEventListener("beforeinstallprompt",listener);window.removeEventListener("appinstalled",installed);navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange);window.clearInterval(timer)};
  },[]);
  function dismiss(){localStorage.setItem(installDismissedKey,"1");setHidden(true)}
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
  if(legacyHost)return <aside className="installPrompt updatePrompt"><span className="appBrandMark">!</span><div><strong>Old {brand.name} installation</strong><small>{legacyHost} does not synchronize with the production app.</small></div><a href={`https://${productionHost}/`}>Open production</a></aside>;
  if(waiting)return <aside className="installPrompt updatePrompt">{!brand.isPreview&&<CedrivaMark/>}<div><strong>{brand.name} update ready</strong><small>Refresh the app identity and install the latest {brand.name} experience.</small></div><button onClick={()=>waiting.postMessage({type:"SKIP_WAITING"})}>Update now</button></aside>;
  if(hidden||(!event&&!showIos))return null;
  return <aside className="installPrompt" aria-live="polite">{!brand.isPreview&&<CedrivaMark/>}<div><strong>Keep {brand.name} on your phone</strong><small>{installError||(showIos?"Use your browser’s Share menu, then choose Add to Home Screen.":"Install the mobile app experience.")}</small></div>{event&&<button onClick={install} disabled={installing}>{installing?"Opening…":"Install"}</button>}<button className="installDismiss" onClick={dismiss} aria-label="Dismiss install suggestion">×</button></aside>;
}
