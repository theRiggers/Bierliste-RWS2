
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bierliste RWS2',
    short_name: 'Bierliste',
    description: 'Getränkeverwaltung für die Mannschaft RWS2',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d12d2d',
    icons: [
      {
        src: 'https://picsum.photos/seed/beer/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/beer/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
