'use client';

import React from 'react';
import { CallPanel } from '@/components/CallPanel';
import { PhoneCall, Sparkles, Activity, ShieldCheck, Zap, Radio } from 'lucide-react';

export default function CallPage() {
  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              REAL-TIME FULL DUPLEX
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
              GEMINI CLOUD + INDIC NEURAL TTS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Live Voice Studio Playground
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Conversational loop: Microphone → Faster-Whisper STT → Cloud Gemini 2.5 Flash / Local Ollama → Neural TTS. Sub-400ms turnaround.
          </p>
        </div>

        {/* Real-time Hardware Telemetry Bar */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span>380ms Turnaround</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 px-2 text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Silero VAD (Barge-in ON)</span>
          </div>
        </div>
      </div>

      <CallPanel />
    </div>
  );
}
