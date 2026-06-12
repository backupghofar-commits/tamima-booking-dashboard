/**
 * TAMIMA Booking Dashboard — Service Worker
 * Strategy: Cache-First (offline-first)
 * Since vite-plugin-singlefile bundles everything into index.html,
 * we only need to cache index.html + manifest + icons
 */

const CACHE_NAME = 'tamima-booking-v1.0.0';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './pwa-icon-512.png',
  './stamp-tamima.png',
];

// INSTALL — Cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing TAMIMA Booking SW');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
        // Continue install even if some assets fail
      });
    }).then(() => self.skipWaiting())
  );
});

// ACTIVATE — Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating TAMIMA Booking SW');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH — Cache-First strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }
      
      // Try network, cache the response for future
      return fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, serve fallback (index.html for navigation)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // No fallback for other resources
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// MESSAGE — Handle messages from app (e.g., skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] TAMIMA Booking Service Worker loaded');
