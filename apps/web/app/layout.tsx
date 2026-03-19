import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Pocket Agent',
  description: 'Phone-first remote coding environment for a local Codex host.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#142b28',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
