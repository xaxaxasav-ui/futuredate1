import type {Metadata} from 'next';
export const dynamic = 'force-dynamic';

import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { ClientThemeProvider } from '@/components/ClientThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';

const inter = Inter({ 
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  preload: false
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-space',
  display: 'swap',
  preload: false
});

export const metadata: Metadata = {
  title: 'Lavmee | AI Знакомства нового поколения',
  description: 'Испытайте новое поколение знакомств с динамической оценкой личности с помощью ИИ и иммерсивными виртуальными свиданиями.',
  metadataBase: new URL('https://lavmee.ru'),
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
  alternates: {
    canonical: 'https://lavmee.ru',
  },
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
          <SupabaseProvider>
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <Toaster />
          </SupabaseProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
