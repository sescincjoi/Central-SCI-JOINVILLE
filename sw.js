const CACHE_NAME = 'central-sci-v4';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './pwa/manifest.json',
  './pwa/app.js',
  './pwa/lucide.min.js',
  './pwa/icons/icon-192.png',
  './pwa/icons/icon-256.png'
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
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
