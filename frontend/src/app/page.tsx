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
  MailCheck,
  Code2,
  Sparkles,
  Radio,
  Sliders,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  Phone,
  Building2,
  Stethoscope,
  Wheat,
  Truck,
  Check,
} from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';

interface PersonaDemo {
  id: string;
  name: string;
  role: string;
  language: string;
  langTag: string;
  icon: any;
  greetingText: string;
  audioSampleText: string;
  accent: string;
}

const PERSONA_DEMOS: PersonaDemo[] = [
  {
    id: 'taj-hotel',
    name: 'Taj Residency Desk',
    role: 'Hotel Room Booking & Concierge',
    language: 'Hinglish / Hindi',
    langTag: 'HI',
    icon: Building2,
    greetingText: '“Namaste! Welcome to Taj Residency. How may I assist you with your room reservation or dining today?”',
    audioSampleText: 'नमस्ते! ताज रेसिडेंसी में आपका स्वागत है। क्या मैं आपके लिए कमरा बुक करूँ या कोई अन्य सहायता करूँ?',
    accent: 'Warm & Hospitable',
  },
  {
    id: 'krishi-mandi',
    name: 'Maharashtra Krishi Kendra',
    role: 'Farmer & Mandi Price Assistant',
    language: 'Pure Marathi',
    langTag: 'MR',
    icon: Wheat,
    greetingText: '“नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील कांद्याचे आणि खतांचे दर जाणून घेण्यासाठी बोला.”',
    audioSampleText: 'नमस्कार! आज कांद्याला प्रति क्विंटल २,१०० रुपये भाव आहे. आपल्याला खतांची ऑर्डर द्यायची आहे का?',
    accent: 'Native Rural Marathi',
  },
  {
    id: 'dental-clinic',
    name: 'Dr. Patil Dental Clinic',
    role: 'Clinic Reception & Appointments',
    language: 'Hindi & English',
    langTag: 'HI',
    icon: Stethoscope,
    greetingText: '“Hello, Dr. Patil’s Dental Care. Are you looking to book a teeth cleaning or root canal consultation?”',
    audioSampleText: 'नमस्ते, डॉक्टर पाटील क्लिनिक। क्या आप शाम ५ बजे का अपॉइंटमेंट बुक करना चाहते हैं?',
    accent: 'Professional & Caring',
  },
  {
    id: 'apmc-wholesale',
    name: 'APMC Logistics & Mandi',
    role: 'Wholesale Supplier Orders',
    language: 'Hindi / English',
    langTag: 'EN',
    icon: Truck,
    greetingText: '“Namaste! APMC Wholesale Dispatch. Inquiring about truck delivery schedules or bulk grain orders?”',
    audioSampleText: 'नमस्ते जी, आपका ५० बोरी गेहूं का ऑर्डर डिस्पैच हो गया है, कल सुबह ११ बजे तक पहुंचेगा।',
    accent: 'Fast & Direct',
  },
];

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Active persona preview
  const [activePersona, setActivePersona] = useState<PersonaDemo>(PERSONA_DEMOS[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Interactive Cost Calculator State
  const [monthlyCalls, setMonthlyCalls] = useState<number>(5000);
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
    ]).then(([agentsData, callsData, statsData]) => {
      setAgents(agentsData);
      setCalls(callsData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const handlePlaySample = (persona: PersonaDemo) => {
    setActivePersona(persona);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlayingPreview && activePersona.id === persona.id) {
        setIsPlayingPreview(false);
        return;
      }
      setIsPlayingPreview(true);
      const utterance = new SpeechSynthesisUtterance(persona.audioSampleText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingPreview(false);
      utterance.onerror = () => setIsPlayingPreview(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 2500);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl pb-16">
      {/* 1. HERO SECTION: Grand, Warm, Human & Tactile */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Voice Telephony Built for India • 100% Self-Hosted</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.15]">
            Your 24/7 AI Receptionist & Outbound Phone Operator.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Answers incoming calls, books appointments, speaks fluent{' '}
            <strong className="text-zinc-200 font-semibold">Marathi, Hindi, Gujarati, and English</strong>,
            and dials hundreds of leads automatically. No per-minute fees, no Vapi markup.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/call"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-4 h-4 fill-current" />
              <span>Make a Voice Call Now</span>
            </Link>

            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Launch Bulk Phone Calls</span>
            </Link>

            <div className="flex items-center gap-2 text-xs text-zinc-400 px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Works with any regular Jio/Airtel SIM or Twilio</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative glowing corner accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      </section>

      {/* 2. INTERACTIVE VOICE AGENT SHOWCASE: Hear them speak */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Ready-To-Use Indian Voice Receptionists</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Click any agent to listen to their voice and greeting script
            </p>
          </div>
          <Link
            href="/agents"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>Customize All Scripts & Prompts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONA_DEMOS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = activePersona.id === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => setActivePersona(persona)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                      {persona.langTag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-100">{persona.name}</h3>
                  <p className="text-xs text-emerald-400/90 font-medium mt-0.5">
                    {persona.role}
                  </p>

                  <p className="text-xs text-zinc-400 italic mt-3 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70 line-clamp-3">
                    {persona.greetingText}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">{persona.accent}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySample(persona);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isSelected && isPlayingPreview
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {isSelected && isPlayingPreview ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Hear Voice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. THREE SIMPLE STEPS: How any person uses Bizora Voice */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            How Simple It Is — 3 Steps For Any Business
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            No complex setup, no developer skills required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Choose Your AI Assistant</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Select your language (Marathi, Hindi, Gujarati, or English). Give your assistant a name and specify your business details (hotel room rates, clinic timings, or mandi products).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Upload Numbers or Receive Inbound</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload an Excel sheet of customer numbers to call them automatically, or forward your incoming business calls directly to your AI receptionist.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-zinc-100">AI Speaks & Records Everything</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The AI converses naturally, answers questions, books slots, and emails you a complete written transcript with call recordings.
            </p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE CLOUD COST CALCULATOR: The Ultimate Eye-Opener */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Interactive Cost Savings Calculator
              </h2>
              <p className="text-xs text-zinc-400">
                Compare your actual cost vs paying Vapi.ai + ElevenLabs + OpenAI cloud charges
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-400 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <Check className="w-3.5 h-3.5" />
            <span>99.8% Savings Retained</span>
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="text-zinc-300 font-medium">Estimated Monthly Customer Phone Calls:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {monthlyCalls.toLocaleString()} calls / month ({(monthlyCalls * avgCallMinutes).toLocaleString()} mins of voice)
            </span>
          </div>

          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={monthlyCalls}
            onChange={(e) => setMonthlyCalls(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2.5 bg-zinc-950 rounded-lg"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            {/* Vapi.ai Cloud Stack */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-red-500/25 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Vapi.ai Cloud Bill (Monthly)
              </span>
              <div className="text-2xl font-extrabold text-red-400">
                ₹{vapiMonthlyTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 pt-1">
                \$0.20/min markup + ElevenLabs TTS + OpenAI LLM
              </p>
            </div>

            {/* Bizora Voice */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Bizora Voice (Monthly)
              </span>
              <div className="text-2xl font-extrabold text-emerald-400">
                ₹{bizoraMonthlyTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-400/90 pt-1">
                ₹0 AI inference + ₹299 Jio Unlimited Calling SIM
              </p>
            </div>

            {/* Net Savings */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Net Annual Savings
              </span>
              <div className="text-2xl font-black text-emerald-200 font-mono">
                ₹{annualSavings.toLocaleString()} / yr
              </div>
              <p className="text-[11px] text-emerald-300/80 pt-1">
                Zero cloud tax. Retained in your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUICK POWER ACTIONS: 4 Big Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/call"
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Live Voice Studio</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Speak into your microphone and test the AI live with zero lag.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 mt-4 flex items-center gap-1">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/campaigns"
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Bulk Phone Dialer</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Upload lead lists to dial hundreds of contacts in Marathi/Hindi.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 mt-4 flex items-center gap-1">
            <span>Start Campaign</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/outreach"
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MailCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Voice Notes & WhatsApp</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Send studio-quality Marathi/Hindi voice recordings directly.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-400 mt-4 flex items-center gap-1">
            <span>Send Voice Note</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/history"
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Call Recordings & Logs</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Listen to recorded audio calls, read transcripts, and view outcomes.
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-300 mt-4 flex items-center gap-1">
            <span>View Call History</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </section>

      {/* 6. RECENT CALL ACTIVITY */}
      <section className="bg-zinc-900/80 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">Recent Call Activity</h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading call activity...</div>
        ) : calls.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-500 mx-auto flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400 font-medium">No calls made yet.</p>
            <Link
              href="/call"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Make Your First Call</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {calls.slice(0, 5).map((call) => (
              <div
                key={call.id}
                className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-850/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono text-xs">
                    {call.agent_id ? call.agent_id.substring(0, 2).toUpperCase() : 'AI'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">
                      {call.agent_name || `Session ${call.session_id.substring(0, 8)}`}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Duration: {formatDuration(call.duration)} • {formatDate(call.started_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      call.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {call.status}
                  </span>
                  <Link
                    href="/history"
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
