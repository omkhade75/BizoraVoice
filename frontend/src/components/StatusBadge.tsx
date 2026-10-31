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
        bg: 'bg-obsidian-elevated text-text-tertiary border-border-subtle',
        dot: 'bg-text-tertiary',
        ping: false,
      };
    }

    switch (state) {
      case 'listening':
        return {
          label: 'Listening (VAD Active)',
          bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
          ping: true,
        };
      case 'thinking':
        return {
          label: 'Reasoning (LLM Stream)',
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
          ping: true,
        };
      case 'speaking':
        return {
          label: 'AI Speaking (Neural TTS)',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          ping: true,
        };
      case 'idle':
      default:
        return {
          label: 'Voice Core Standby',
          bg: 'bg-obsidian-elevated text-text-secondary border-border-subtle',
          dot: 'bg-amber-500',
          ping: false,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium tracking-wide transition-all shadow-xs ${config.bg}`}
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
