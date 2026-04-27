// 🔒 Service Worker with HTTPS enforcement for production
const isDev = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  console.log('📦 [SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activating service worker');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 🔒 SECURITY: Convert HTTP to HTTPS (but allow localhost HTTP for dev)
  if (url.protocol === 'http:' && !isDev(url.hostname)) {
    console.log('🔄 [SW] Converting HTTP → HTTPS:', url.href);
    url.protocol = 'https:';
    event.respondWith(fetch(url.toString(), { method: request.method }));
    return;
  }

  // Cache static assets
  if (request.url.includes('.js') || request.url.includes('.css') || request.url.includes('.woff')) {
    event.respondWith(
      caches.open('v1').then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch((err) => {
            console.error('❌ [SW] Fetch failed:', err);
            return cached;
          });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Network first for everything else
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cached) => {
        return cached || caches.match('/index.html');
      });
    })
  );
});