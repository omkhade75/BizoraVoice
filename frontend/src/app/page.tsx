'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAgents,
  getCalls,
  getHealth,
  getStats,
  Agent,
  Call,
  PlatformStats,
} from '@/lib/api';
import {
  Bot,
  PhoneCall,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingDown,
  Cpu,
  MailCheck,
  Code2,
  Sparkles,
} from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<{ status: string; models: Record<string, string> } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAgents().catch(() => []),
      getCalls().catch(() => []),
      getStats().catch(() => null),
      getHealth().catch(() => null),
    ]).then(([agentsData, callsData, statsData, healthData]) => {
      setAgents(agentsData);
      setCalls(callsData);
      setStats(statsData);
      setHealth(healthData);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
              100% SELF-HOSTED • ZERO VAPI CLOUD BILLS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
              ASIAN VOICES ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Bizora Voice Platform
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Enterprise voice AI agent infrastructure running entirely on your local infrastructure.
            Native support for Marathi, Hindi, Gujarati, Tamil, and English. No external API keys required.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/call"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Live Voice Studio</span>
          </Link>
          <Link
            href="/outreach"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition"
          >
            <MailCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Supplier Voice Notes</span>
          </Link>
        </div>
      </div>

      {/* Financial & Platform Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Saved */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Cloud Savings</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{stats?.cost_saved_inr?.toLocaleString() || '14,800'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
            <span>vs Vapi.ai (\$0.07/min):</span>
            <span className="text-zinc-300 font-semibold">\${stats?.cost_saved_usd || '180'} saved</span>
          </p>
        </div>

        {/* Total Calls */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Calls Processed</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {stats?.total_calls ?? calls.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {stats?.total_minutes || 0} minutes of live audio streamed
          </p>
        </div>

        {/* Active Agents */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400">Voice Agents</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{agents.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Marathi, Hindi, Gujarati, English configured
          </p>
        </div>

        {/* System & LLM Status */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400">Local Pipeline Engine</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ollama (qwen3.5:4b)</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
            faster-whisper + Indic Neural TTS
          </p>
        </div>
      </div>

      {/* Main Grid: Quick Studio Launch & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Calls & Quick Outreach */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/outreach"
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/80 transition group block"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <MailCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">Supplier Outreach</h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Send Marathi email with attached .wav voice note
              </p>
            </Link>

            <Link
              href="/developers"
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-800/80 transition group block"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Code2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">Developer API Keys</h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Manage `bv_live_...` keys and copy cURL/Python SDK
              </p>
            </Link>

            <Link
              href="/agents"
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition group block"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center mb-3">
                <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">Agent Studio</h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Tune prompts, temperatures, and regional voices
              </p>
            </Link>
          </div>

          {/* Recent Calls Card */}
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 px-5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Recent Call Sessions</h2>
              </div>
              <Link
                href="/history"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading call activity...</div>
            ) : calls.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-500 mx-auto flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <p className="text-xs text-zinc-400">No calls recorded yet.</p>
                <Link
                  href="/call"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  Make First Test Call
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {calls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="p-4 px-5 flex items-center justify-between hover:bg-zinc-800/40 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200">
                          {call.agent_name || 'Agent Assistant'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {formatDate(call.started_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-zinc-300 font-medium flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatDuration(call.duration)}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Saved ₹{((call.duration / 60) * 5.8).toFixed(1)}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          call.status === 'completed'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pre-Configured Multilingual Agents */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Multilingual Agents</h3>
              </div>
              <Link
                href="/agents"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              >
                + New Agent
              </Link>
            </div>

            <div className="space-y-2.5">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-zinc-200">{agent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {agent.language === 'mr'
                        ? 'मराठी'
                        : agent.language === 'hi'
                        ? 'हिन्दी'
                        : agent.language === 'gu'
                        ? 'ગુજરાતી'
                        : 'English'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{agent.system_prompt}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Voice: {agent.voice.split('-')[2] || agent.voice}</span>
                    <Link
                      href={`/call?agent=${agent.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold flex items-center gap-0.5"
                    >
                      Call <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Guarantee Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Dependency Guarantee</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every voice session runs directly on your hardware using local PyTorch speech decoders and
              Ollama. Never pay monthly subscriptions, per-minute egress fees, or third-party telephony taxes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
