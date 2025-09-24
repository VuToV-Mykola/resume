/**
 * Service Worker для PWA
 * Забезпечує offline функціональність та кешування ресурсів
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `resume-generator-${CACHE_VERSION}`;

// Ресурси для кешування
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/core/state-management.js',
  '/js/services/validation-service.js',
  '/js/ui/accessibility.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/live-print-preview.js',
  '/js/main.js',
  '/manifest.json',
  '/favicon.svg'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Стратегія кешування: Cache First з Network Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ігноруємо не-GET запити
  if (request.method !== 'GET') {
    return;
  }

  // Ігноруємо API запити
  if (request.url.includes('/api/') || request.url.includes('localhost:8000')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }

        console.log('[SW] Fetching from network:', request.url);
        return fetch(request)
          .then(response => {
            // Кешуємо успішні відповіді
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);

            // Повертаємо offline сторінку для HTML запитів
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Повідомлення від клієнта
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});