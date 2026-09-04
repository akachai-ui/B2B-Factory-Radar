import type { Metadata } from 'next';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'RouteHunter | ระบบบริหารการขาย & เรดาร์โรงงานอุตสาหกรรม',
  description: 'RouteHunter - ระบบค้นหาพิกัดโรงงานครอบคลุม 6 อำเภอ 990+ แห่ง วางแผนเส้นทางออกพบลูกค้า และ Company Quick Fact (TH / EN / ZH)',
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Prompt:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>

        {/* Essential Leaflet and MarkerCluster Scripts */}
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
