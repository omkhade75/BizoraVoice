'use client';

import React from 'react';
import { Agent } from '@/lib/api';
import { Bot, Volume2, Cpu, Edit2, Trash2, ArrowRight, MessageSquareQuote, Cloud, Copy } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onSelectCall: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete, onSelectCall, onDuplicate }: AgentCardProps) {
  const isGemini = agent.model.toLowerCase().startsWith('gemini');

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'mr':
        return { name: 'मराठी', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'hi':
        return { name: 'हिन्दी', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'gu':
        return { name: 'ગુજરાતી', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'ta':
        return { name: 'தமிழ்', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
      default:
        return { name: 'English', bg: 'bg-obsidian-elevated text-text-secondary border-border-subtle' };
    }
  };

  const langInfo = getLanguageLabel(agent.language);

  return (
    <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-5 shadow-xs hover:border-border-medium transition flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian-canvas border border-border-subtle text-amber-500 flex items-center justify-center font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary text-sm">{agent.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold ${langInfo.bg}`}>
                  {langInfo.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary mt-1 font-mono">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Volume2 className="w-3 h-3 text-text-tertiary" />
                  {agent.voice.split('-')[2] || agent.voice}
                </span>
                <span>•</span>
                {isGemini ? (
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Cloud className="w-3 h-3" />
                    <span>Gemini 2.5 Cloud</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                    <Cpu className="w-3 h-3" />
                    <span>{agent.model}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(agent.id)}
                className="p-1.5 text-text-tertiary hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition"
                title="Duplicate Assistant"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onEdit(agent)}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-obsidian-elevated rounded-lg transition"
              title="Edit Assistant"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              title="Delete Assistant"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {agent.greeting_message && (
          <div className="mb-2.5 p-2 rounded-xl bg-obsidian-canvas border border-border-subtle text-[11px] text-text-secondary flex items-start gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic">"{agent.greeting_message}"</span>
          </div>
        )}

        <p className="text-xs text-text-secondary line-clamp-3 bg-obsidian-canvas p-3 rounded-xl border border-border-subtle font-mono leading-relaxed">
          {agent.system_prompt}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[10px] text-text-tertiary font-mono">
          Max {agent.max_duration_seconds ? Math.round(agent.max_duration_seconds / 60) : 10}m session
        </span>
        <button
          onClick={() => onSelectCall(agent.id)}
          className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
        >
          <span>Test Call</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
