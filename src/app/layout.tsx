
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { StoreProvider } from '@/lib/store';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Bierliste RWS2',
  description: 'Verwalte deine Fußballmannschaft-Getränke effizient und smart.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bierliste RWS2',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#d12d2d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <FirebaseClientProvider>
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
