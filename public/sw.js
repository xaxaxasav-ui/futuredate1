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
  
  let data = { title: 'Lavmee', body: 'Новое уведомление', icon: '/images/favicon.svg', tag: 'lavmee', vibrate: [200, 100, 200, 100, 200] };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.log('[SW] Could not parse push data');
    }
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/favicon.svg',
    badge: '/images/favicon.svg',
    vibrate: data.vibrate || [200, 100, 200, 100, 200],
    tag: data.tag || 'lavmee',
    renotify: true,
    requireInteraction: true,
    silent: false,
    priority: 'high',
    data: {
      url: data.url || '/',
      callId: data.callId || null,
      callerId: data.callerId || null
    },
    actions: [
      { action: 'answer', title: '📞 Принять' },
      { action: 'decline', title: '❌ Отклонить' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Lavmee', options)
      .then(() => console.log('[SW] Notification shown'))
      .catch(err => console.log('[SW] Notification error:', err))
  );
  
  if (data.sound) {
    event.waitUntil(
      self.registration.showNotification(data.title, { 
        ...options, 
        silent: false 
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  
  if (event.action === 'answer') {
    console.log('[SW] Answer action clicked');
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(`${urlToOpen}?action=answer&callId=${notificationData.callId}`);
      })
    );
  } else if (event.action === 'decline') {
    console.log('[SW] Decline action clicked');
    if (notificationData.callId) {
      fetch(`${self.location.origin}/api/calls/decline?callId=${notificationData.callId}`, {
        method: 'POST'
      }).catch(() => {});
    }
  } else {
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
  }
});

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_CALL_NOTIFICATION') {
    const { callerName, callId, callerAvatar } = event.data;
    
    const options = {
      body: `${callerName} звонит вам`,
      icon: callerAvatar || '/images/favicon.svg',
      badge: '/images/favicon.svg',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'incoming-call',
      renotify: true,
      requireInteraction: true,
      silent: false,
      priority: 'high',
      data: {
        url: `/date?user=${callerId}&call=${callId}`,
        callId,
        callerId: callerId
      },
      actions: [
        { action: 'answer', title: '📞 Принять' },
        { action: 'decline', title: '❌ Отклонить' }
      ]
    };
    
    self.registration.showNotification('📞 Входящий звонок!', options)
      .then(() => console.log('[SW] Call notification shown'))
      .catch(err => console.log('[SW] Call notification error:', err));
  }
});