'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { CopilotDrawer } from '@/components/CopilotDrawer';
import { Sparkles, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Standalone public pages (landing, login, signup, auth callback) render full-width without dashboard sidebar
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/login/' ||
    pathname === '/signup' ||
    pathname === '/signup/' ||
    pathname.startsWith('/auth/callback');

  useEffect(() => {
    const token = getAuthToken();
    if (!isPublicPage && !token) {
      router.replace('/login');
    } else {
      setAuthChecked(true);
    }
  }, [pathname, isPublicPage, router]);

  if (isPublicPage) {
    return (
      <div className="w-full min-h-screen bg-obsidian-canvas text-text-primary flex flex-col selection:bg-amber-500/20 selection:text-amber-300 transition-colors">
        {children}
      </div>
    );
  }

  // If visiting protected page without verified token, show crisp Sonic gate
  if (!authChecked) {
    return (
      <div className="w-full min-h-screen bg-obsidian-canvas flex flex-col items-center justify-center text-text-secondary gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="text-xs uppercase tracking-widest font-mono text-text-tertiary">
          Authenticating Session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-obsidian-canvas text-text-primary transition-colors">
      {/* Sidebar with onOpenCopilot */}
      <Sidebar onOpenCopilot={() => setCopilotOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Copilot Button */}
      <button
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-obsidian-elevated dark:bg-[#191B17] hover:bg-obsidian-hover text-text-primary font-medium text-xs shadow-lg border border-border-subtle hover:border-amber-500/40 transition-all hover:scale-105 active:scale-95 group"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold text-xs">Copilot</span>
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/15 text-amber-400">
          AI
        </span>
      </button>

      {/* AI Copilot Drawer */}
      <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
