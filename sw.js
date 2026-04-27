self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.url.includes('.js') || request.url.includes('.css')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});