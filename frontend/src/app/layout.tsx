import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bizora Voice | Self-Hosted AI Telephony & Voice Platform',
  description:
    '100% self-hosted replacement for Vapi AI with zero external API keys. Multilingual Asian voice agents (Marathi, Hindi, Gujarati, Tamil, English), supplier voice notes, and real-time streaming.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-zinc-950 text-zinc-100">
      <body className={`${inter.className} min-h-full flex bg-zinc-950 text-zinc-100 antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
