'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CopilotDrawer } from '@/components/CopilotDrawer';
import { Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar with onOpenCopilot */}
      <Sidebar onOpenCopilot={() => setCopilotOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-5 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Copilot Button (desktop and mobile) */}
      <button
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs shadow-xl shadow-amber-950/40 border border-amber-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 fill-zinc-950" />
        <span>Ask Vaani Copilot</span>
      </button>

      {/* AI Copilot Drawer */}
      <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
