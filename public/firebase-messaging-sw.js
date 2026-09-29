/**
 * Firebase Cloud Messaging Service Worker for NP Job Portal
 * Handles background push notifications when browser/tab is closed or in background.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Standard Firebase Applet configuration for Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyDemoDummyKeyForBuildSafety1234567",
  authDomain: "np-job-portal.firebaseapp.com",
  projectId: "np-job-portal",
  storageBucket: "np-job-portal.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload?.notification?.title || payload?.data?.title || 'NP Job Portal अलर्ट';
    const notificationOptions = {
      body: payload?.notification?.body || payload?.data?.body || 'नई सरकारी नौकरी व एडमिट कार्ड की जानकारी देखें।',
      icon: payload?.notification?.icon || payload?.data?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      image: payload?.notification?.image || payload?.data?.image,
      data: {
        url: payload?.data?.url || payload?.data?.click_action || payload?.fcmOptions?.link || '/'
      },
      tag: payload?.data?.tag || 'np-job-alert',
      renotify: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase compat init notice:', e);
}

// Fallback native push event listener (works even without Firebase SDK initialized)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let title = 'NP Job Portal - सरकारी भर्ती अलर्ट';
  let body = 'नई सरकारी नौकरी, एडमिट कार्ड अथवा रिजल्ट जारी!';
  let url = '/';
  let image = undefined;

  try {
    const data = event.data.json();
    title = data.notification?.title || data.data?.title || data.title || title;
    body = data.notification?.body || data.data?.body || data.body || body;
    url = data.data?.url || data.data?.click_action || data.url || '/';
    image = data.notification?.image || data.data?.image || data.image;
  } catch {
    body = event.data.text() || body;
  }

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image,
    data: { url },
    vibrate: [200, 100, 200],
    tag: 'np-job-alert',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event handler - opens or focuses target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the URL, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
