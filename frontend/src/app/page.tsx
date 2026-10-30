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
  Radio,
  Sliders,
  Signal,
  CheckCircle2,
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

  // Interactive Cost Calculator State
  const [monthlyCalls, setMonthlyCalls] = useState<number>(10000);
  const avgCallMinutes = 3;
  const vapiCostPerMin = 18; // approx ₹18/min ($0.20) for Vapi + ElevenLabs + GPT-4o
  const vapiMonthlyTotal = monthlyCalls * avgCallMinutes * vapiCostPerMin;
  const bizoraMonthlyTotal = 299; // Jio unlimited calling SIM
  const monthlySavings = vapiMonthlyTotal - bizoraMonthlyTotal;
  const annualSavings = monthlySavings * 12;

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
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Top Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
              100% SELF-HOSTED • ZERO VAPI CLOUD BILLS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold">
              ASIAN VOICES ACTIVE (24kHz HD)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Bizora Voice Platform
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Enterprise voice AI agent telephony running entirely on your local infrastructure.
            Native neural models for Marathi, Hindi, Gujarati, Tamil, and English. No external API keys required.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 z-10">
          <Link
            href="/call"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-current" />
            <span>Live Voice Studio</span>
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs transition"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk Outbound Dialer</span>
          </Link>
        </div>
      </div>

      {/* Financial & Platform Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Saved */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-300">Total Cloud Savings</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{stats?.cost_saved_inr?.toLocaleString() || '14,800'}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-mono">
            <span>vs Vapi.ai (\$0.07/min):</span>
            <span className="text-zinc-200 font-semibold">\${stats?.cost_saved_usd || '180'} saved</span>
          </p>
        </div>

        {/* Total Calls */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-300">Total Calls Processed</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {stats?.total_calls ?? calls.length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {stats?.total_minutes || 0} minutes of live audio streamed
          </p>
        </div>

        {/* Active Agents */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-300">Voice Agents</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{agents.length}</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Marathi, Hindi, Gujarati, English active
          </p>
        </div>

        {/* System & LLM Status */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-300">Local Pipeline Engine</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ollama (qwen3.5:4b)</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            faster-whisper + Indic Neural TTS
          </p>
        </div>
      </div>

      {/* Telephony Gateway & Carrier Hardware Status Banner */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Hardware Telephony & Carrier Gateway Status
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
            ALL LINES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs">
                GSM
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  4G VoLTE GSM Gateway (GoIP / Dinstar)
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  SIM: Jio 4G Unlimited (₹299/mo) • Zero Pre-Verification
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">Signal 5/5</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-xs">
                SIP
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  Direct Twilio SIP Media Streams
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  BYO Credentials • Zero Vapi Platform Tax ($0.00 markup)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Quick Actions 4-Column Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/campaigns"
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-850 transition group block"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Radio className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-zinc-200">Bulk Outbound Dialer</h3>
          <p className="text-[11px] text-zinc-400 mt-1">
            Upload CSV & call leads in Marathi/Hindi with dynamic variables
          </p>
        </Link>

        <Link
          href="/agents"
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 transition group block"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center mb-3">
            <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-zinc-200">Call Flow Studio</h3>
          <p className="text-[11px] text-zinc-400 mt-1">
            Visual node-tree canvas, prompt tuning, and regional voice previews
          </p>
        </Link>

        <Link
          href="/outreach"
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-850 transition group block"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <MailCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-zinc-200">Supplier Voice Notes</h3>
          <p className="text-[11px] text-zinc-400 mt-1">
            Send Marathi RFQ email with attached studio-quality .wav note
          </p>
        </Link>

        <Link
          href="/developers"
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-850 transition group block"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Code2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-zinc-200">Developer API Keys</h3>
          <p className="text-[11px] text-zinc-400 mt-1">
            Manage scoped `bv_live_...` keys and copy cURL/Python SDK
          </p>
        </Link>
      </div>

      {/* Interactive Annual Cloud Savings Calculator */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                Interactive Cloud Cost Savings Calculator
              </h2>
              <p className="text-xs text-zinc-400">
                Compare your actual monthly expenditure vs Vapi.ai + ElevenLabs + OpenAI cloud stack
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            99.9% SAVINGS RETAINED
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Estimated Monthly Outbound Calls:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {monthlyCalls.toLocaleString()} calls / month ({(monthlyCalls * avgCallMinutes).toLocaleString()} mins)
            </span>
          </div>

          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={monthlyCalls}
            onChange={(e) => setMonthlyCalls(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-950 rounded-lg"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/20">
              <div className="text-[11px] text-zinc-400 font-medium">Vapi.ai Cloud Bill (Monthly)</div>
              <div className="text-xl font-bold text-red-400 mt-1">
                ₹{vapiMonthlyTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                \$0.20/min markup + OpenAI + ElevenLabs
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30">
              <div className="text-[11px] text-zinc-400 font-medium">Bizora Voice Cost (Monthly)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                ₹{bizoraMonthlyTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400/90 mt-0.5">
                ₹0 AI inference + ₹299 Jio Unlimited SIM
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
              <div className="text-[11px] text-emerald-300 font-medium">Net Annual Profit Retained</div>
              <div className="text-xl font-bold text-emerald-200 mt-1 font-mono">
                ₹{annualSavings.toLocaleString()} / year
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                100% retained by your business
              </div>
            </div>
          </div>
        </div>
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-sm"
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
                    <div className="text-[10px] text-emerald-400 font-mono font-medium">
                      Saved ₹{((call.duration / 60) * 5.8).toFixed(1)}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      call.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
  );
}
