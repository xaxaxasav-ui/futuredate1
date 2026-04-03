const CACHE_NAME = 'lavmee-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = { title: 'Новое уведомление', body: 'У вас новое сообщение', icon: '/images/favicon.svg' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log('Could not parse push data');
    }
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/favicon.svg',
    badge: '/images/favicon.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'call', title: 'Принять звонок' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Свидание AI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event.action);
  event.notification.close();
  
  if (event.action === 'call') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/date')
    );
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});