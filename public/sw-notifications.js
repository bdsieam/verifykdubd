// Custom Service Worker script imported by Workbox for handling system notifications & clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/?openAdmin=verify_queue';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            referenceId: event.notification.data?.referenceId || null,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
