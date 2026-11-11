// Service worker: shows nudges as notifications while the page is closed or the phone is locked.
// Deliberately no fetch handler, so nothing is ever served from a stale cache.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', event => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // Not ours or malformed; still show something, since a push must always show a notification
  }

  // Always shown, even with the app open: Safari drops the subscription after pushes that show nothing
  event.waitUntil(
    self.registration.showNotification(data.title || 'Drífa sig! 🍺', {
      body: data.body || 'Þú átt eftir að gefa einkunn',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'nudge',
      // Buzz again for a repeat nudge, even though it replaces the last one
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find(client => client.url === url) || windows[0]
    if (open) {
      await open.focus()
      // navigate() rejects for a page this worker doesn't control yet; it's focused either way
      if (open.url !== url) await open.navigate(url).catch(() => {})
      return
    }
    await self.clients.openWindow(url)
  })())
})
