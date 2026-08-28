self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('puc-cover-store').then((cache) => {
      return cache.addAll(['pdf.html', 'pdf.css', 'pdf.js', 'download.jpg', 'manifest.json']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});