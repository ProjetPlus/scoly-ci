// Service Worker Scoly — Push + cache-buster global
const CACHE_NAME = 'scoly-v8-nocache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' }));
      }))
  );
});

// Network-first pour HTML/JSON afin d'éviter tout cache navigateur périmé.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');
  const isJSON = accept.includes('application/json') || url.pathname.endsWith('.json');
  if (!isHTML && !isJSON) return;
  event.respondWith(
    fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Scoly', body: 'Nouvelle notification', icon: '/favicon.svg', badge: '/favicon.svg', tag: 'scoly-notification', data: {} };
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {}
      };
    } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon, badge: data.badge, tag: data.tag, data: data.data,
    vibrate: [200, 100, 200], requireInteraction: true,
    actions: data.data?.requires_confirmation ? [
      { action: 'confirm', title: "Oui, c'est moi" },
      { action: 'block', title: 'Bloquer' }
    ] : []
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  let targetUrl = '/';
  if (event.action === 'confirm' || event.action === 'block') {
    targetUrl = '/?notification_action=' + event.action + '&session_id=' + (d.session_id || '') + '&notification_id=' + (d.notification_id || '');
  } else if (d.url) targetUrl = d.url;
  else if (d.order_id) targetUrl = '/account';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (c.url.includes(self.location.origin) && 'focus' in c) { c.navigate(targetUrl); return c.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
