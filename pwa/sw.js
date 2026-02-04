const CACHE_NAME = 'app-cache-v1';
const FILES_TO_CACHE = [
  '../',
  '../index.html',
  './manifest.json',
  './app.js',
  './lucide.min.js',
  './icons/icon-192.png',
  './icons/icon-256.png'
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
