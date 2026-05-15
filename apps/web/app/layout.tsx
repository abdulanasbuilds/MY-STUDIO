// MY STUDIO — Root Layout
// PURPOSE: Root layout with Inter font, global styles, metadata, providers

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MY STUDIO',
  description: 'AI content creation platform — 16 modules, 50+ open source AI models, one platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg text-text-primary antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
