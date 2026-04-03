const CACHE_NAME = 'jc-recomp-v1';
const urlsToCache = [
  '/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'JC Recomp', body: 'Hora de entrenar!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'JC Recomp', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'jc-recomp-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      type: data.type || 'general',
    },
    actions: [],
  };

  // Add contextual actions based on notification type
  if (data.type === 'meal' || (data.title && data.title.toLowerCase().includes('desayuno')) ||
      (data.title && data.title.toLowerCase().includes('comida')) ||
      (data.title && data.title.toLowerCase().includes('cena'))) {
    options.tag = 'meal-reminder';
    options.data.url = '/?tab=nutrition';
    options.actions = [
      { action: 'log-meal', title: 'Registrar comida' },
      { action: 'dismiss', title: 'Despues' },
    ];
  } else if (data.type === 'workout' || (data.title && data.title.toLowerCase().includes('entrenamiento'))) {
    options.tag = 'workout-reminder';
    options.data.url = '/?tab=workout';
    options.actions = [
      { action: 'start-workout', title: 'Iniciar entreno' },
      { action: 'dismiss', title: 'Despues' },
    ];
  } else if (data.type === 'evening' || (data.title && data.title.toLowerCase().includes('noches'))) {
    options.tag = 'evening-reminder';
    options.data.url = '/?tab=dashboard';
    options.actions = [
      { action: 'log-day', title: 'Registrar dia' },
      { action: 'dismiss', title: 'Despues' },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  let targetUrl = '/';

  if (action === 'log-meal') {
    targetUrl = '/?tab=nutrition';
  } else if (action === 'start-workout') {
    targetUrl = '/?tab=workout';
  } else if (action === 'log-day') {
    targetUrl = '/?tab=dashboard';
  } else if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    })
  );
});
