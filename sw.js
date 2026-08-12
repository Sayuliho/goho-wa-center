// GOHO WA Center - Service Worker
// Fase 1: PWA support, caching, background sync
const CACHE_NAME = 'goho-wa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css'
];
// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});
// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
// Fetch — network first, fallback to cache for HTML
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip POST/non-GET — Cache API tidak support method selain GET/HEAD
  if (event.request.method !== 'GET') return;

  // Cross-origin requests (Workers, GAS, dll) — skip, biarkan ke network
  if (url.origin !== self.location.origin) return;

  // API calls — always network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // HTML — network first, fallback cache
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Other assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
// Push notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'GOHO WA Center';
  const options = {
    body: data.body || 'Ada pesan baru',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'goho-notif',
    renotify: true,
    data: { roomId: data.roomId, url: '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
// Notification click — open/focus app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow('/');
    })
  );
});
