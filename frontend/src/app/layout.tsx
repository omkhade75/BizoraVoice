import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

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
      <body className="min-h-full flex bg-zinc-950 text-zinc-100 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
