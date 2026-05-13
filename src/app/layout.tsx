import type {Metadata} from 'next';
export const dynamic = 'force-dynamic';

import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { ClientThemeProvider } from '@/components/ClientThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { NetworkStatusIndicator } from '@/hooks/use-network';

const inter = Inter({ 
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap'
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-space',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Lavmee | AI Знакомства нового поколения',
  description: 'Испытайте новое поколение знакомств с динамической оценкой личности с помощью ИИ и иммерсивными виртуальными свиданиями.',
  metadataBase: new URL('https://lavmee.ru'),
  manifest: '/manifest.json',
  icons: {
    icon: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
  alternates: {
    canonical: 'https://lavmee.ru',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden flex flex-col min-h-screen">
        <ClientThemeProvider>
          <FirebaseProvider>
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <Toaster />
            <NetworkStatusIndicator />
          </FirebaseProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}