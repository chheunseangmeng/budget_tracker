const CACHE_NAME='budget-pwa-v1';
const URLS_TO_CACHE=['./','./index.html','./app.js','./manifest.json','https://cdn.tailwindcss.com','https://cdn.jsdelivr.net/npm/chart.js'];

self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(URLS_TO_CACHE)));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
