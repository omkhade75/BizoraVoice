'use client';

import React from 'react';
import { CallPanel } from '@/components/CallPanel';
import { PhoneCall, Sparkles } from 'lucide-react';

export default function CallPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              REAL-TIME FULL DUPLEX
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
              24kHz HD AUDIO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-emerald-400" />
            Live Voice Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Conversational loop: Browser Microphone → faster-whisper STT → Local Ollama LLM → Indic
            Neural TTS → Browser Speaker. Sub-second turnaround.
          </p>
        </div>
      </div>

      <CallPanel />
    </div>
  );
}
