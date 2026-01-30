// ============================================================
// SERVICE WORKER - ReKalcula PWA + Push Notifications
// Ubicación: public/sw.js (REEMPLAZAR EL EXISTENTE)
// ============================================================

const CACHE_NAME = 'rekalcula-v2';

// Archivos a cachear para offline
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
];

// ============================================================
// INSTALACIÓN
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Error al cachear:', err);
      })
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVACIÓN
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// FETCH - Network first, fallback to cache
// ============================================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ============================================================
// PUSH NOTIFICATIONS - Recibir notificación
// ============================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let data = {
    title: 'ReKalcula',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    url: '/dashboard'
  };

  // Intentar parsear los datos del push
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        badge: payload.notification?.badge || payload.badge || data.badge,
        url: payload.fcmOptions?.link || payload.data?.url || payload.url || data.url,
        data: payload.data || {}
      };
    } catch (e) {
      // Si no es JSON, usar el texto plano
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      ...data.data
    },
    actions: [
      {
        action: 'open',
        title: 'Ver ahora'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    requireInteraction: true,
    tag: 'rekalcula-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================================
// CLICK EN NOTIFICACIÓN
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Obtener URL del data o usar default
  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Buscar si ya hay una ventana abierta
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================
// CIERRE DE NOTIFICACIÓN
// ============================================================
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});