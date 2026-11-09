import type { MetadataRoute } from 'next'

// Lets phones "Add to Home Screen" and open the app full screen, without the browser bar, during a tasting
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hreðjar Bjórsmakk',
    short_name: 'Bjórsmakk',
    description: 'Synchronized beer tasting ratings for groups of friends',
    lang: 'is',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Pine, the app's --background
    background_color: '#123A2C',
    theme_color: '#123A2C',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
