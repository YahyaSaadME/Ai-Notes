self.addEventListener('push', function (event) {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {}
  const title = data.title || 'Notification'
  const options = {
    body: data.body,
    icon: data.icon || '/vercel.svg',
    data: { url: data.url || '/' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url
  event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
    for (const client of windowClients) {
      if ('focus' in client) return client.focus()
    }
    if (clients.openWindow && url) return clients.openWindow(url)
  }))
})
