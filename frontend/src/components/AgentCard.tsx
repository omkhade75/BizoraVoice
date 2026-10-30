'use client';

import React from 'react';
import { Agent } from '@/lib/api';
import { Bot, Volume2, Cpu, Edit2, Trash2, ArrowRight, MessageSquareQuote } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onSelectCall: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete, onSelectCall }: AgentCardProps) {
  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'mr':
        return { name: 'मराठी', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'hi':
        return { name: 'हिन्दी', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'gu':
        return { name: 'ગુજરાતી', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'ta':
        return { name: 'தமிழ்', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { name: 'English', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const langInfo = getLanguageLabel(agent.language);

  return (
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-sm hover:border-zinc-700 transition flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">{agent.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${langInfo.bg}`}
                >
                  {langInfo.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-zinc-400" />
                  {agent.voice.split('-')[2] || agent.voice}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-zinc-400" />
                  {agent.model}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(agent)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
              title="Edit Agent"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
              title="Delete Agent"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {agent.greeting_message && (
          <div className="mb-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-emerald-300 flex items-start gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic">"{agent.greeting_message}"</span>
          </div>
        )}

        <p className="text-xs text-zinc-400 line-clamp-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 font-mono leading-relaxed">
          {agent.system_prompt}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 font-mono">
          Max {agent.max_duration_seconds ? Math.round(agent.max_duration_seconds / 60) : 10}m session
        </span>
        <button
          onClick={() => onSelectCall(agent.id)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
        >
          <span>Test Call</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
