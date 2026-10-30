'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAgents,
  getCalls,
  getHealth,
  getStats,
  getStoredUser,
  Agent,
  Call,
  PlatformStats,
  AuthUser,
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
  Coffee,
  Mic,
  Cpu,
  Layers,
  PhoneForwarded,
  Hash,
  Activity,
  FileSpreadsheet,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';
import { BrandLogo } from '@/components/BrandLogo';

interface PersonaDemo {
  id: string;
  name: string;
  role: string;
  industry: string;
  language: string;
  langTag: string;
  icon: any;
  greetingText: string;
  audioSampleText: string;
  accent: string;
  agentId: string;
}

const PERSONA_DEMOS: PersonaDemo[] = [
  {
    id: 'taj-hotel',
    name: 'Taj Residency Concierge',
    role: 'Luxury Hotel Room Booking & Dining',
    industry: 'Hospitality',
    language: 'Hinglish / Hindi',
    langTag: 'HI',
    icon: Building2,
    greetingText: '“Namaste! Welcome to Taj Residency. How may I assist you with your luxury room reservation or table dining today?”',
    audioSampleText: 'नमस्ते! ताज रेसिडेंसी में आपका स्वागत है। क्या मैं आपके लिए कमरा बुक करूँ या कोई अन्य सहायता करूँ?',
    accent: 'Warm, Polite & Hospitable',
    agentId: 'taj-hotel',
  },
  {
    id: 'krishi-mandi',
    name: 'Maharashtra Krishi Kendra',
    role: 'Farmer Advisory & APMC Mandi Rates',
    industry: 'Agriculture',
    language: 'Pure Marathi',
    langTag: 'MR',
    icon: Wheat,
    greetingText: '“नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील लाल कांद्याचे आणि खतांचे दर जाणून घेण्यासाठी बोला.”',
    audioSampleText: 'नमस्कार! आज नाशिक मार्केटमध्ये कांद्याला प्रति क्विंटल २,४५० रुपये भाव आहे. आपल्याला खतांची ऑर्डर द्यायची आहे का?',
    accent: 'Native Rural Marathi',
    agentId: 'krishi-kendra',
  },
  {
    id: 'dental-clinic',
    name: 'Dr. Patil Dental Care',
    role: 'Clinic Triage, Appointments & Follow-up',
    industry: 'Healthcare',
    language: 'Hindi & English',
    langTag: 'HI',
    icon: Stethoscope,
    greetingText: '“Hello, Dr. Patil’s Dental Care. Are you looking to book an appointment for teeth cleaning or a root canal consultation?”',
    audioSampleText: 'नमस्ते, डॉक्टर पाटील डेंटल क्लिनिक। क्या आप शाम ५ बजे का इमरजेंसी अपॉइंटमेंट बुक करना चाहते हैं?',
    accent: 'Professional & Caring',
    agentId: 'patil-dental',
  },
  {
    id: 'apmc-wholesale',
    name: 'APMC Logistics & Mandi',
    role: 'Wholesale Grain Dispatch & Tracking',
    industry: 'Logistics',
    language: 'Hindi & English',
    langTag: 'EN',
    icon: Truck,
    greetingText: '“Namaste! APMC Wholesale Dispatch. Inquiring about truck delivery schedules, dispatch slips, or bulk grain orders?”',
    audioSampleText: 'नमस्ते जी, आपका ५० बोरी गेहूं का ऑर्डर डिस्पैच हो गया है, कल सुबह ११ बजे तक पहुंचेगा।',
    accent: 'Direct & Fast-Paced',
    agentId: 'apmc-mandi',
  },
  {
    id: 'chai-cafe',
    name: 'Chai Tapri & Quick Cafe',
    role: 'Food Delivery & Instant UPI Payment Link',
    industry: 'F&B Retail',
    language: 'Hinglish / Hindi',
    langTag: 'HI',
    icon: Coffee,
    greetingText: '“Namaste bhaiya! Chai Tapri me swagat hai. Adrak chai aur bun-maska pack kar du ya parcel mangwana hai?”',
    audioSampleText: 'नमस्ते भैया! अदरक चाय और बन-मस्का का आर्डर ले लिया है। आपके फोन पर यूपीआई पेमेंट लिंक भेज दिया है।',
    accent: 'Energetic & Street-Smart',
    agentId: 'taj-hotel',
  },
];

interface PipelineStage {
  id: string;
  name: string;
  tech: string;
  latency: string;
  cost: string;
  description: string;
  icon: any;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'telephony',
    name: '1. Ingress & Telephony',
    tech: '4G VoLTE GSM Gateway / Twilio Streams',
    latency: '24ms',
    cost: '₹0 (Jio SIM ₹299/mo)',
    description: 'Bi-directional audio bridge connecting ordinary Indian mobile SIMs or Twilio imported numbers with zero recipient OTP pre-verification blocks.',
    icon: Radio,
  },
  {
    id: 'vad',
    name: '2. Voice Activity Detection',
    tech: 'Silero VAD (Local Engine)',
    latency: '15ms',
    cost: '₹0.00 / Free',
    description: 'Sub-second conversational turnarounds with intelligent barge-in detection. When the human speaks, the bot stops talking instantly.',
    icon: Mic,
  },
  {
    id: 'stt',
    name: '3. Speech-to-Text',
    tech: 'faster-whisper (CTranslate2)',
    latency: '85ms',
    cost: '₹0.00 / Free',
    description: 'Local GPU/CPU speech recognition tuned specifically for Indian accents, code-mixed Hinglish, and regional Marathi/Gujarati/Tamil phrasing.',
    icon: Activity,
  },
  {
    id: 'llm',
    name: '4. Reasoning & Dialogue',
    tech: 'Qwen2.5 / DeepSeek via Local Ollama',
    latency: '110ms',
    cost: '₹0.00 / Free',
    description: 'Self-hosted LLM with zero per-token cloud bills. Understands context, extracts appointment times, prices, and handles conversational logic.',
    icon: Cpu,
  },
  {
    id: 'tts',
    name: '5. Neural Voice Synthesis',
    tech: 'Kokoro ONNX & Indic Neural TTS',
    latency: '95ms',
    cost: '₹0.00 / Free',
    description: 'Studio-grade 24kHz HD audio generation with native emotional inflection in Marathi (Aarohi), Hindi (Swara/Madhur), and Gujarati (Dhwani).',
    icon: Volume2,
  },
];

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Active persona preview
  const [activePersona, setActivePersona] = useState<PersonaDemo>(PERSONA_DEMOS[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Active pipeline stage tab
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<PipelineStage>(PIPELINE_STAGES[0]);

  // Interactive Cost Calculator State
  const [monthlyCalls, setMonthlyCalls] = useState<number>(5000);
  const avgCallMinutes = 3;
  const vapiCostPerMin = 18; // approx ₹18/min ($0.20) for Vapi + ElevenLabs + OpenAI
  const vapiMonthlyTotal = monthlyCalls * avgCallMinutes * vapiCostPerMin;
  const vaaniMonthlyTotal = 299; // Jio unlimited calling SIM
  const monthlySavings = vapiMonthlyTotal - vaaniMonthlyTotal;
  const annualSavings = monthlySavings * 12;

  // Interactive Live Call Demo State
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);
  const [simulatedTurnIndex, setSimulatedTurnIndex] = useState(0);

  const SIMULATED_DIALOGUE = [
    { speaker: 'Assistant', text: 'Namaste! Welcome to Taj Residency. How may I assist you with your reservation today?' },
    { speaker: 'Customer', text: 'Namaste, do you have a Deluxe Lake View suite available this Saturday?' },
    { speaker: 'Assistant', text: 'Certainly sir! We have 2 Lake View suites available for this Saturday at ₹14,500 plus taxes. Shall I reserve one under your number?' },
    { speaker: 'Customer', text: 'Yes please, and kindly add complimentary breakfast.' },
    { speaker: 'Assistant', text: 'Done! Your reservation is confirmed with breakfast at The Verandah. I have sent an SMS receipt to your mobile.' },
  ];

  useEffect(() => {
    setCurrentUser(getStoredUser());
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

  const handleTriggerSimulatedDialogue = (index: number) => {
    setSimulatedTurnIndex(index);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(SIMULATED_DIALOGUE[index].text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl pb-20">
      {/* 0. TOP ANNOUNCEMENT BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/20 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-zinc-200">
            India's Sovereign AI Telephony Platform
          </span>
          <span className="hidden sm:inline text-zinc-500">•</span>
          <span className="hidden sm:inline text-zinc-400">
            100% Free Bulk Outbound Calling + 1-Click Twilio Number Import
          </span>
        </div>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-zinc-300 font-medium hidden sm:inline">
                Welcome back, <strong className="text-emerald-400">{currentUser.name}</strong>
              </span>
              <Link
                href="/agents"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition border border-zinc-700/80 shadow-sm"
              >
                <span>Voice Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-sm shadow-emerald-950/40 hover:scale-105 active:scale-95"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 1. HERO SECTION: Grand, Tactile & Interactive */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950 border border-zinc-800/80 p-6 md:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vaani Voice • Sovereign AI Telephony Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.12]">
              The Voice AI Platform Built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
                Real Indian Business.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              Answers incoming customer calls in sub-seconds, speaks fluent{' '}
              <strong className="text-zinc-200 font-semibold">
                Marathi, Hindi, Gujarati, and Indian English
              </strong>
              , and dials thousands of leads automatically with zero per-minute fees or recipient OTP locks.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-zinc-950" />
                <span>Get Started for Free</span>
              </Link>

              <Link
                href="/call"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-100 border border-zinc-700/80 font-bold text-sm transition-all hover:scale-105 active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Test Live Call</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 border border-zinc-800 font-medium text-xs transition-all hover:border-zinc-700"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </Link>
            </div>

            {/* Micro Feature Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/70">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>₹299/mo Unlimited Calling</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero OTP Pre-Verification</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-400ms Voice Latency</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Telephony Console Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-zinc-950 border border-emerald-500/30 p-5 shadow-2xl space-y-4">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-semibold text-zinc-300">
                    LIVE CALL TELEMETRY
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  4G VoLTE ACTIVE
                </span>
              </div>

              {/* Caller Identity Pill */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100">+91 98200 11223</div>
                    <div className="text-[10px] text-zinc-400">Incoming Caller • Mumbai, MH</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">01:42</span>
                  <div className="text-[9px] text-zinc-500 font-mono">16kHz PCM</div>
                </div>
              </div>

              {/* Dynamic Animated Frequency Equalizer */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Spoken Dialogue</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">
                    Turn {simulatedTurnIndex + 1} of 5
                  </span>
                </div>

                {/* Animated Audio Equalizer Bars */}
                <div className="flex items-center justify-center gap-1 h-12 py-1">
                  {[24, 40, 18, 36, 48, 22, 38, 52, 28, 44, 32, 20, 46, 30, 16, 38, 24].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>

                {/* Live Dialogue Bubble */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 leading-relaxed min-h-[58px] flex items-center">
                  <span className="font-semibold text-emerald-400 mr-2 shrink-0">
                    {SIMULATED_DIALOGUE[simulatedTurnIndex].speaker}:
                  </span>
                  <span>"{SIMULATED_DIALOGUE[simulatedTurnIndex].text}"</span>
                </div>
              </div>

              {/* Interactive Audio Stepper Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block px-1">
                  Click to Test Conversation Steps:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleTriggerSimulatedDialogue(0)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-medium text-center transition"
                  >
                    1. Greeting
                  </button>
                  <button
                    onClick={() => handleTriggerSimulatedDialogue(1)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-medium text-center transition"
                  >
                    2. Query
                  </button>
                  <button
                    onClick={() => handleTriggerSimulatedDialogue(2)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-medium text-center transition"
                  >
                    3. Booking
                  </button>
                </div>
              </div>

              {/* Link into Live Call */}
              <Link
                href="/call"
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2 transition"
              >
                <span>Speak to AI Live in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* 2. INTERACTIVE VOICE AGENT SHOWCASE: Hear real Indian voices speak */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MULTILINGUAL VOICE FACTORY
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                24KHZ HD NEURAL
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Ready-To-Use Indian Voice Receptionists</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click any agent to listen to their voice script, test emotional cadence, and launch immediate calls.
            </p>
          </div>

          <Link
            href="/agents"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
          >
            <span>Visual Call Flow Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 5 Persona Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PERSONA_DEMOS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = activePersona.id === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => setActivePersona(persona)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                      {persona.langTag}
                    </span>
                  </div>

                  <span className="text-[10px] text-amber-400/90 font-mono font-medium block">
                    {persona.industry}
                  </span>
                  <h3 className="font-bold text-sm text-zinc-100 mt-0.5 leading-snug">
                    {persona.name}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    {persona.role}
                  </p>

                  <p className="text-[11px] text-zinc-400 italic mt-3 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/70 line-clamp-3 leading-relaxed">
                    {persona.greetingText}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">
                    {persona.accent.split(' ')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySample(persona);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
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
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. INTERACTIVE ARCHITECTURE PIPELINE: The Technical Powerhouse */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold mb-1">
              SELF-HOSTED STACK • ZERO CLOUD LOCK-IN
            </div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Full-Duplex Real-Time Telephony Architecture</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click each stage to inspect latency metrics, inference engines, and local hardware execution.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <span className="text-emerald-400 font-bold">Total Latency:</span>
            <span>~340ms (Sub-second turnaround)</span>
          </div>
        </div>

        {/* 5-Stage Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const Icon = stage.icon;
            const isSelected = selectedPipelineStage.id === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedPipelineStage(stage)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-zinc-950 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {stage.latency}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-zinc-200">{stage.name}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{stage.tech}</p>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Deep-Dive Card */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Active Stage Inspector
              </span>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                {selectedPipelineStage.name} — {selectedPipelineStage.tech}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-zinc-400">
                Stage Latency: <strong className="text-emerald-400">{selectedPipelineStage.latency}</strong>
              </span>
              <span className="text-zinc-400">
                Platform Markup: <strong className="text-emerald-400">{selectedPipelineStage.cost}</strong>
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
            {selectedPipelineStage.description}
          </p>
        </div>
      </section>

      {/* 4. INTERACTIVE CLOUD COST CALCULATOR: The Financial Eye-Opener */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 shadow-2xl space-y-6">
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
            <span>99.8% Cost Savings Retained</span>
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

            {/* Vaani Voice */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Vaani Voice (Monthly)
              </span>
              <div className="text-2xl font-extrabold text-emerald-400">
                ₹{vaaniMonthlyTotal.toLocaleString()}
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

      {/* 5. VAPI VS VAANI VOICE: Side-By-Side Comparison Matrix */}
      <section className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Enterprise Telephony Comparison: Vapi vs Vaani Voice</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Why Indian enterprises choose self-hosted sovereign voice infrastructure over US cloud wrappers.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>Explore Bulk Dialer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase">
                <th className="py-3 px-4">Capability</th>
                <th className="py-3 px-4 text-emerald-400 font-bold">Vaani Voice (100% Self-Hosted)</th>
                <th className="py-3 px-4 text-amber-400 font-bold">Vapi.ai (US Cloud SaaS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-zinc-200">Bulk Outbound Calling</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">
                  100% Free & Unlimited on your own server
                </td>
                <td className="py-3 px-4 text-red-400/90">
                  Locked behind expensive tier ($500+/mo) + per-min markup
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-zinc-200">Recipient Phone Pre-Verification</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">
                  Zero OTP requirement. Dials any regular Indian mobile directly
                </td>
                <td className="py-3 px-4 text-red-400/90">
                  Blocks outbound calling unless recipient verifies OTP
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-zinc-200">Twilio Number Import (BYOT)</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">
                  1-Click direct import of existing Twilio landlines/toll-free
                </td>
                <td className="py-3 px-4 text-zinc-400">
                  Requires custom enterprise billing contracts
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-zinc-200">Regional Indic Voices</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">
                  Native Marathi, Hindi, Gujarati, Tamil (24kHz HD Neural)
                </td>
                <td className="py-3 px-4 text-zinc-400">
                  Limited; requires costly third-party ElevenLabs API keys
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-zinc-200">Per-Minute Platform Markup</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">
                  ₹0.00 / Free (100% Sovereign)
                </td>
                <td className="py-3 px-4 text-zinc-400 font-mono">
                  \$0.07 to \$0.20 per minute (~₹6 to ₹18/min)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. QUICK POWER ACTIONS: 4 Big Core Feature Tiles */}
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
              Speak into your microphone and test the AI live with zero latency.
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
          href="/numbers"
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Hash className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100">Twilio Import & GSM</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Connect local 4G VoLTE SIMs or import US/UK Twilio numbers in 1 click.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-400 mt-4 flex items-center gap-1">
            <span>Manage Numbers</span>
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

      {/* 7. RECENT CALL ACTIVITY */}
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
