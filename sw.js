/**
 * Service Worker — Com va? Bicing Barcelona
 * Provides offline caching and makes the app installable as a PWA.
 */

const CACHE_NAME = 'comva-bicing-v1';

// Files that form the "app shell" — cached on install
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './js/db.js',
    './js/app.js',
    './manifest.json',
    './img/icon-192.png',
    './img/icon-512.png'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Take control of all pages
});

// Fetch: network-first strategy (try network, fall back to cache)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and external CDN requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache the fresh response
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(event.request);
            })
    );
});
