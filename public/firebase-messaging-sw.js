// ============================================================
// Firebase Messaging Service Worker
// Ubicación: public/firebase-messaging-sw.js
// ============================================================
// IMPORTANTE: No llamar a showNotification() cuando el mensaje
// incluye campo 'notification', porque Firebase lo muestra
// automáticamente. Si se llama, se generan DUPLICADOS.
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
// Firebase muestra automáticamente la notificación cuando el
// mensaje incluye el campo 'notification'. Este handler solo
// actúa para mensajes DATA-ONLY (sin campo notification).
// ============================================================
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);

  // Si el mensaje tiene campo 'notification', Firebase ya lo muestra
  // automáticamente. NO llamar a showNotification() o se duplica.
  if (payload.notification) {
    console.log('[SW] Notificación mostrada automáticamente por Firebase (no duplicar)');
    return;
  }

  // Solo para mensajes data-only (sin campo notification)
  const notificationTitle = payload.data?.title || 'reKalcula';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: payload.data?.tag || 'rekalcula-' + Date.now(),
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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