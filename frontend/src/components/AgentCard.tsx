'use client';

import React from 'react';
import { Agent } from '@/lib/api';
import { Bot, Volume2, Cpu, Edit2, Trash2, ArrowRight, MessageSquareQuote, Cloud, Zap } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onSelectCall: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete, onSelectCall }: AgentCardProps) {
  const isGemini = agent.model.toLowerCase().startsWith('gemini');

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'mr':
        return { name: 'मराठी', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'hi':
        return { name: 'हिन्दी', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'gu':
        return { name: 'ગુજરાતી', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case 'ta':
        return { name: 'தமிழ்', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      default:
        return { name: 'English', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' };
    }
  };

  const langInfo = getLanguageLabel(agent.language);

  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{agent.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${langInfo.bg}`}>
                  {langInfo.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-1">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-zinc-400" />
                  {agent.voice.split('-')[2] || agent.voice}
                </span>
                <span>•</span>
                {isGemini ? (
                  <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                    <Cloud className="w-3 h-3" />
                    <span>Gemini Cloud (0% load)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Cpu className="w-3 h-3" />
                    <span>{agent.model}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(agent)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Edit Assistant"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
              title="Delete Assistant"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {agent.greeting_message && (
          <div className="mb-2.5 p-2 rounded-xl bg-emerald-50/50 dark:bg-zinc-950/80 border border-emerald-200/50 dark:border-zinc-800/80 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic">"{agent.greeting_message}"</span>
          </div>
        )}

        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 font-mono leading-relaxed">
          {agent.system_prompt}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 font-mono">
          Max {agent.max_duration_seconds ? Math.round(agent.max_duration_seconds / 60) : 10}m session
        </span>
        <button
          onClick={() => onSelectCall(agent.id)}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
        >
          <span>Test Call</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
