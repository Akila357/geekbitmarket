self.addEventListener('fetch', (event) => {
  const request = event.request;
  let url = new URL(request.url);
  
  // 🔒 SECURITY: Convert HTTP to HTTPS (but allow localhost HTTP for dev)
  if (url.protocol === 'http:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    console.log('🔄 [SW] Converting HTTP to HTTPS:', url.href);
    url.protocol = 'https:';
  }

  if (request.url.includes('.js') || request.url.includes('.css')) {
    event.respondWith(fetch(new Request(url.toString(), request)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(new Request(url.toString(), request)).catch(() => {
        // Network error fallback
        return caches.match('/index.html');
      });
    })
  );
});