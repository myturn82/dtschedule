self.addEventListener('push', (event) => {
  console.log('[SW] push event received, hasData:', !!event.data)
  if (!event.data) {
    console.warn('[SW] push event has no data, ignoring')
    return
  }
  let data
  try {
    data = event.data.json()
    console.log('[SW] push data parsed:', JSON.stringify(data))
  } catch (e) {
    console.error('[SW] push data parse failed:', e)
    return
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? '알림', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
    }).then(() => {
      console.log('[SW] showNotification success')
    }).catch((err) => {
      console.error('[SW] showNotification failed:', err)
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
