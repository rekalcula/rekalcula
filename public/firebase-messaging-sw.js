// Firebase Messaging Service Worker
// Usar importScripts para cargar Firebase (compatible con Service Workers)
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

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Handler para mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);

  const notificationTitle = payload.notification?.title || 'reKalcula';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/notification-icon.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para clicks en notificaciones
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