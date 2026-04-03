const CACHE_NAME = 'lavmee-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = { title: 'Новое уведомление', body: 'У вас новое сообщение', icon: '/images/favicon.svg' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log('[SW] Could not parse push data');
    }
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/favicon.svg',
    badge: '/images/favicon.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'call', title: 'Принять' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Свидание AI', options).then(() => {
      console.log('[SW] Notification shown');
    }).catch(err => {
      console.log('[SW] Notification error:', err);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});