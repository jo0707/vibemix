import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
export const metadata: Metadata = {
  title: 'VibeMix',
  description: 'Create music compilation videos from your images and songs instantly!',
  icons: {
    icon: [
      { url: '/logo_64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/logo_128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/logo_256x256.png', sizes: '256x256', type: 'image/png' }
    ],
    apple: [
      { url: '/logo_128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/logo_256x256.png', sizes: '256x256', type: 'image/png' }
    ],
    shortcut: '/logo_64x64.png'
  }
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
