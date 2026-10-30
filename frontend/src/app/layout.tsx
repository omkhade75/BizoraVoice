import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Vaani Voice | Sovereign AI Telephony & Multilingual Voice Platform',
  description:
    '100% self-hosted sovereign alternative to Vapi AI with zero external API markups. Multilingual regional voice agents (Marathi, Hindi, Gujarati, Tamil, English), dual telephony (Twilio + 4G VoLTE SIM), and sub-400ms streaming.',
  icons: {
    icon: '/icon.svg',
    apple: '/logo.svg',
  },
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
