'use client';

import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '@/hooks/useCall';
import { CallState } from '@/hooks/useWebSocket';
import { formatTime } from '@/lib/utils';
import { Bot, Sparkles, User } from 'lucide-react';

interface TranscriptProps {
  transcript: TranscriptItem[];
  callState: CallState;
}

export function Transcript({ transcript, callState }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, callState]);

  return (
    <div className="flex flex-col h-full bg-obsidian-surface rounded-2xl border border-border-subtle overflow-hidden shadow-sm transition-colors">
      <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-obsidian-elevated/40">
        <h3 className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Live Voice Transcript
        </h3>
        <span className="text-[11px] font-mono text-text-tertiary">
          {transcript.length} turn{transcript.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[340px] max-h-[520px]">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-tertiary my-auto min-h-[260px]">
            <div className="w-10 h-10 rounded-xl bg-obsidian-elevated border border-border-subtle flex items-center justify-center text-text-secondary mb-2">
              <Bot className="w-5 h-5 stroke-1" />
            </div>
            <p className="text-xs text-text-secondary font-medium">No spoken dialogue yet.</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Press "Start Voice Call" and speak naturally into your microphone.
            </p>
          </div>
        ) : (
          transcript.map((item) => {
            const isUser = item.role === 'user';
            return (
              <div
                key={item.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-amber-500 text-obsidian-canvas font-medium rounded-br-none'
                      : 'bg-obsidian-elevated text-text-primary border border-border-subtle rounded-bl-none'
                  }`}
                >
                  <p>{item.text}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right font-mono ${
                      isUser ? 'text-obsidian-canvas/80' : 'text-text-tertiary'
                    }`}
                  >
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {callState === 'thinking' && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-obsidian-elevated border border-border-subtle rounded-xl px-4 py-2.5 flex items-center gap-1.5 shadow-xs text-xs text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-300" />
              <span className="ml-1 text-[11px] text-text-secondary">Synthesizing audio...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
