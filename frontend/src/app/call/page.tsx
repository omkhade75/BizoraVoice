'use client';

import React, { Suspense } from 'react';
import { CallPanel } from '@/components/CallPanel';
import { PhoneCall, Activity, ShieldCheck, Zap, Loader2 } from 'lucide-react';

function CallPanelFallback() {
  return (
    <div className="w-full h-96 rounded-2xl bg-obsidian-surface border border-border-subtle flex flex-col items-center justify-center gap-3 text-text-secondary">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      <span className="text-xs font-mono">Initializing Acoustic Duplex Engine...</span>
    </div>
  );
}

export default function CallPage() {
  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold">
              REAL-TIME FULL DUPLEX
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-border-subtle text-text-secondary border border-border-subtle text-[10px] font-mono font-bold">
              329ms PIPELINE • GEMINI + OLLAMA
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-amber-500" />
            Voice Playground & Telemetry
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Live acoustic duplex loop: WebRTC Microphone → Edge VAD → Gemini 2.5 Flash / Ollama → Neural TTS. Test conversation turn-taking in real-time.
          </p>
        </div>

        {/* Real-time Hardware Telemetry Bar */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-obsidian-surface border border-border-subtle text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2 text-emerald-500 font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span>329ms Total</span>
          </div>
          <span className="text-border-subtle">|</span>
          <div className="flex items-center gap-1.5 px-2 text-text-secondary">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Silero VAD (Barge-in ON)</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<CallPanelFallback />}>
        <CallPanel />
      </Suspense>
    </div>
  );
}
