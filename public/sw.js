const CACHE_NAME = 'twitch-alert-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/tailwind.min.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/img/twitch-logo.png'
];

// Service Worker Kurulumu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Önbellek açıldı');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker Aktivasyonu
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski önbellek siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Olayı - Cache-First Stratejisi
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Geçerli bir yanıt değilse veya yeniden yönlendirme ise, direkt döndür
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache için yanıtın klonlanması
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // URL'de api veya firebase gibi terimler içeriyorsa cachelenmesin
                if (!event.request.url.includes('api.twitch.tv')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          });
      })
      .catch(() => {
        // Offline durumunda gösterilecek fallback içeriği
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Push Bildirimi Alındı
self.addEventListener('push', (event) => {
  if (event.data) {
    const notification = event.data.json();
    
    const options = {
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: notification.url
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  }
});

// Bildirime Tıklandı
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});