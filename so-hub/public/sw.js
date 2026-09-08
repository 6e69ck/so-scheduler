// Service Worker for Soaring Eagles Hub Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough fetch handler required by Chromium for PWA installability
self.addEventListener('fetch', (event) => {
  // Allow default network fetch
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Soaring Eagles Hub', body: event.data.text() };
    }
  }

  const title = data.title || 'Soaring Eagles Hub';
  const options = {
    body: data.body || 'A new show was just published! Tap to open the Hub.',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/',
      eventId: data.eventId,
    },
    vibrate: [200, 100, 200],
    tag: data.tag || `show-${data.eventId || Date.now()}`,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When user clicks the OS notification, pull up the Hub without auto-joining
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = (event.notification.data && event.notification.data.url) || '/';
  const urlToOpen = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab of the Hub is already open, focus it and bring it to the foreground
      for (const client of clientList) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no tab is open, open the Hub in a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
