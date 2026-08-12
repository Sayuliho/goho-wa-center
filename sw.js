// GOHO WA Center - Service Worker
const CACHE_NAME = 'goho-wa-v3';

const STATIC_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css'
];

// Install — cache static assets (fonts/icons saja, BUKAN HTML)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — hapus semua cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Cross-origin (Workers, GAS, dll) — skip
  if (url.origin !== self.location.origin) return;

  // API calls — always network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // HTML — NETWORK ONLY, jangan pernah cache
  // Ini fix utama: sebelumnya HTML di-cache, makanya versi lama muncul lagi
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        // Fallback ke cache hanya kalau benar-benar offline
        return caches.match('/index.html');
      })
    );
    return;
  }

  // JS/CSS/assets lain — cache first (aman karena Cloudflare Pages pakai content hash)
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
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
