/* NEONPLAY Update 5.0: conservative static shell cache for GitHub Pages */
const CACHE_NAME='neonplay-shell-v5';
const BASE='/neonplay/';
const SHELL=[BASE,BASE+'index.html',BASE+'manifest.webmanifest',BASE+'neonplay-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('neonplay-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(BASE+'index.html',copy))}return response}).catch(()=>caches.match(BASE+'index.html').then(response=>response||caches.match(BASE))));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok&&url.pathname.startsWith(BASE)){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response})));
});
