const CACHE_NAME = 'app-cache-v1';
const FILES_TO_CACHE = [
  '/Central-SCI/',
  '/Central-SCI/index.html',
  '/Central-SCI/pwa/manifest.json',
  '/Central-SCI/pwa/app.js',
  '/Central-SCI-JOINVILLE/pwa/lucide.min.js',
  '/Central-SCI/pwa/icons/icon-192.png',
  '/Central-SCI/pwa/icons/icon-256.png'
  // adicione outras páginas/recursos necessários
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
