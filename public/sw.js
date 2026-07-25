const CACHE="cedriva-shell-v4";
const SAFE_ASSETS=["/offline","/manifest.webmanifest","/cedriva-mark.svg","/icons/cedriva-app-192-v4.png","/icons/cedriva-app-512-v4.png","/icons/cedriva-apple-180-v4.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SAFE_ASSETS)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||event.request.mode!=="navigate")return;event.respondWith(fetch(event.request).catch(()=>caches.match("/offline")))});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
