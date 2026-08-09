"use client";

import { usePathname } from "next/navigation";

const internalNavigationKey="hojavia:previous-internal-path";

export function safeBackFallback(pathname:string){
  if(pathname.startsWith("/inventory/")||pathname.startsWith("/collections")||pathname.startsWith("/humidors"))return "/inventory";
  if(pathname.startsWith("/learn/"))return "/learn";
  if(pathname.startsWith("/industry/"))return "/industry";
  return "/";
}

export function NavigationBack(){
  const pathname=usePathname();
  if(pathname==="/")return null;
  function goBack(){
    const previousInternalPath=sessionStorage.getItem(internalNavigationKey);
    const sameOriginReferrer=Boolean(document.referrer)&&new URL(document.referrer).origin===window.location.origin;
    if((previousInternalPath||sameOriginReferrer)&&window.history.length>1){sessionStorage.removeItem(internalNavigationKey);window.history.back();return}
    if(previousInternalPath){sessionStorage.removeItem(internalNavigationKey);window.location.assign(previousInternalPath);return}
    window.location.assign(safeBackFallback(pathname));
  }
  return <div className="globalBackBar" aria-label="Page history navigation"><button type="button" onClick={goBack} aria-label="Return to the previous page"><span aria-hidden="true">←</span> Back</button></div>;
}

export function rememberInternalNavigation(event:MouseEvent){
  const link=(event.target as Element|null)?.closest<HTMLAnchorElement>("a[href]");
  if(!link||link.target==="_blank"||link.origin!==window.location.origin)return;
  sessionStorage.setItem(internalNavigationKey,`${window.location.pathname}${window.location.search}${window.location.hash}`);
}
