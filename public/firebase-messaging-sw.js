// ============================================================
// Firebase Messaging Service Worker
// Ubicación: public/firebase-messaging-sw.js
// ============================================================
// ESTRATEGIA: El servidor envía mensajes DATA-ONLY (sin campo
// 'notification'). Así Firebase NUNCA muestra nada automático.
// Este SW es el ÚNICO que muestra la notificación.
// Resultado: exactamente 1 notificación, con iconos correctos.
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyALtN3CwjcHsXNuLkdEEzXff4kBpdJopeg",
  authDomain: "rekalcula-notifications.firebaseapp.com",
  projectId: "rekalcula-notifications",
  storageBucket: "rekalcula-notifications.firebasestorage.app",
  messagingSenderId: "516971826017",
  appId: "1:516971826017:web:194d7d2c8f8cf20b50d320"
});

const messaging = firebase.messaging();

// ============================================================
// Handler para mensajes en segundo plano
// ============================================================
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje recibido:', payload);

  // Título y cuerpo vienen en data (mensaje data-only)
  const title = payload.data?.title || payload.notification?.title || 'reKalcula';
  const body = payload.data?.body || payload.notification?.body || '';

  const notificationOptions = {
    body: body,
    icon: payload.data?.icon || '/icons/icon-192x192.png',
    badge: payload.data?.badge || '/icons/badge-96x96.png',
    tag: payload.data?.tag || 'rekalcula-' + Date.now(),
    requireInteraction: true,
    data: {
      url: payload.data?.url || '/dashboard/notifications',
      ...payload.data
    }
  };

  // Mostrar la notificación (es la ÚNICA, no hay duplicado)
  self.registration.showNotification(title, notificationOptions);
});

// ============================================================
// Handler para clicks en notificaciones
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});