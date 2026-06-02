
import { MetadataRoute } from 'next'

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
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
