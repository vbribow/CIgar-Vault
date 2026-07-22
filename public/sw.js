const CACHE="cigar-vault-shell-v1";
const SAFE_ASSETS=["/offline","/manifest.webmanifest","/icons/cigar-vault-192.png","/icons/cigar-vault-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SAFE_ASSETS)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||event.request.mode!=="navigate")return;event.respondWith(fetch(event.request).catch(()=>caches.match("/offline")))});
