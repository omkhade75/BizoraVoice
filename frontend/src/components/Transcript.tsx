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
    <div className="flex flex-col h-full bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Live Voice Transcript
        </h3>
        <span className="text-[11px] font-mono text-zinc-500">
          {transcript.length} message{transcript.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[340px] max-h-[520px]">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 my-auto min-h-[260px]">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-2">
              <Bot className="w-5 h-5 stroke-1" />
            </div>
            <p className="text-xs text-zinc-400 font-medium">No spoken words yet.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Press "Start Voice Call" and speak naturally into your microphone.
            </p>
          </div>
        ) : (
          transcript.map((item) => {
            const isUser = item.role === 'user';
            return (
              <div
                key={item.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-bl-xs'
                  }`}
                >
                  <p>{item.text}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right font-mono ${
                      isUser ? 'text-emerald-200' : 'text-zinc-500'
                    }`}
                  >
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {callState === 'thinking' && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-sm text-xs text-amber-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-300" />
              <span className="ml-1 text-[11px] text-zinc-400">Synthesizing audio...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
