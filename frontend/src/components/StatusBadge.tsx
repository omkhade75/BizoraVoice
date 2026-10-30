'use client';

import React from 'react';
import { CallState } from '@/hooks/useWebSocket';

interface StatusBadgeProps {
  state: CallState;
  isMuted?: boolean;
}

export function StatusBadge({ state, isMuted = false }: StatusBadgeProps) {
  const getBadgeConfig = () => {
    if (isMuted && state === 'listening') {
      return {
        label: 'Muted',
        bg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
        dot: 'bg-zinc-500',
        ping: false,
      };
    }

    switch (state) {
      case 'listening':
        return {
          label: 'Listening...',
          bg: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
          dot: 'bg-amber-400',
          ping: true,
        };
      case 'thinking':
        return {
          label: 'AI Thinking...',
          bg: 'bg-amber-900/30 text-amber-200 border-amber-700/40',
          dot: 'bg-amber-400',
          ping: true,
        };
      case 'speaking':
        return {
          label: 'AI Speaking...',
          bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50',
          dot: 'bg-emerald-400',
          ping: true,
        };
      case 'idle':
      default:
        return {
          label: 'Ready to Call',
          bg: 'bg-zinc-900 text-zinc-400 border-zinc-800',
          dot: 'bg-zinc-500',
          ping: false,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-all shadow-sm ${config.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span>{config.label}</span>
    </div>
  );
}
