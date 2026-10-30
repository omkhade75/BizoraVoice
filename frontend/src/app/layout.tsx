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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex antialiased font-sans bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
