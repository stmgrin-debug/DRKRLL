const CACHE_NAME = 'camera-pwa-v1';
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
  // Adicione aqui outros assets, como ícones, se forem carregados via JS
];

// Instalação: Armazena os recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch: Captura a rede ou usa o cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o recurso do cache se encontrado
        return response || fetch(event.request);
      })
  );
});