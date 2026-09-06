import type { Metadata } from 'next';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'RouteHunter | ฐานข้อมูลโรงงานอุตสาหกรรม สมุทรปราการ',
  description: 'ระบบเรดาร์และฐานข้อมูลโรงงานอุตสาหกรรม จ.สมุทรปราการ',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      </head>
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100 antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
