'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Pause,
  Building2,
  Stethoscope,
  Wheat,
  Truck,
  Radio,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  ExternalLink,
  Cpu,
  Layers,
  Terminal,
  Copy,
  Check,
  Zap,
  Activity,
  Server,
  Code2,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { VoiceCore3D, VoiceCoreState } from '@/components/VoiceCore3D';
import { getStoredUser, AuthUser } from '@/lib/api';

interface Persona {
  id: string;
  name: string;
  tag: string;
  langName: string;
  business: string;
  icon: any;
  quote: string;
  audioText: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'taj-hotel',
    name: 'Taj Residency Concierge',
    tag: 'Hindi / Hinglish',
    langName: 'हिन्दी',
    business: 'Hotel Reservations & Dining',
    icon: Building2,
    quote: '“Namaste! Welcome to Taj Residency. How may I assist you with your room booking or dining table today?”',
    audioText: 'नमस्ते! ताज रेसिडेंसी में आपका स्वागत है। क्या मैं आपके लिए कमरा बुक करूँ या कोई अन्य सहायता करूँ?',
  },
  {
    id: 'krishi-kendra',
    name: 'Maharashtra Krishi Kendra',
    tag: 'Pure Marathi',
    langName: 'मराठी',
    business: 'Farmer Advisory & Mandi Rates',
    icon: Wheat,
    quote: '“नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील कांद्याचे आणि सोयाबीनचे भाव जाणून घेण्यासाठी बोला.”',
    audioText: 'नमस्कार! आज नाशिक कृषी उत्पन्न बाजार समितीत कांद्याला सरासरी २४५० रुपये प्रति क्विंटल भाव आहे.',
  },
  {
    id: 'patil-dental',
    name: 'Dr. Patil Dental Care',
    tag: 'Hindi & English',
    langName: 'हिन्दी',
    business: 'Clinic Appointments & Patient Triage',
    icon: Stethoscope,
    quote: '“Hello! Dr. Patil Dental Care. Would you like to book a root canal consultation or dental checkup?”',
    audioText: 'नमस्ते! डॉ. पाटिल डेंटल क्लिनिक में आपका स्वागत है। क्या आप दाँतों की जाँच के लिए अपॉइंटमेंट बुक करना चाहते हैं?',
  },
  {
    id: 'apmc-logistics',
    name: 'APMC Wholesale Logistics',
    tag: 'Indian English',
    langName: 'English',
    business: 'Freight Dispatch & Order Tracking',
    icon: Truck,
    quote: '“Namaste! APMC Logistics dispatch desk. Inquiring about truck freight transit or bulk grain delivery?”',
    audioText: 'Namaste! APMC Wholesale Logistics. 40 metric tonnes of grain have departed Navi Mumbai warehouse and will arrive by 5 PM.',
  },
];

const SIMPLE_FAQS = [
  {
    q: 'What is BizoraVoice (Vaani Voice)?',
    a: 'BizoraVoice is an enterprise-grade Voice AI platform and developer infrastructure designed to replace high-cost American cloud wrappers like Vapi.ai. It answers incoming customer calls 24/7 and makes automated outbound campaigns in fluent Marathi, Hindi, Gujarati, and Indian English with sub-second latency.',
  },
  {
    q: 'How does it save money compared to Vapi.ai or Bland.ai?',
    a: 'Vapi and Bland charge $0.15 to $0.20 per minute (~₹14 to ₹18/min). BizoraVoice operates on self-hosted infrastructure and supports standard unlimited domestic SIMs (like Jio/Airtel at ₹299/month), giving you unlimited calling with zero per-minute cloud markups.',
  },
  {
    q: 'How does it achieve sub-329ms voice latency?',
    a: 'We combine Silero VAD (42ms), streaming Gemini 2.5 Flash / local Ollama inference (112ms TTFT), and ultra-fast neural edge speech synthesis (175ms) with zero-buffering WebSocket audio streaming.',
  },
  {
    q: 'Can I connect my existing Twilio number?',
    a: 'Yes! BizoraVoice includes native 1-click Twilio BYOT (Bring Your Own Telephony) import. Enter your Twilio credentials to import your numbers and route incoming calls directly to any configured AI agent or multi-agent squad.',
  },
  {
    q: 'Where is my data stored?',
    a: 'All data is stored in your own dedicated Supabase PostgreSQL database. Your customer recordings, prompts, and lead phone numbers never leave your controlled infrastructure.',
  },
];

const PIPELINE_STEPS = [
  {
    title: '1. Inbound Audio Stream',
    timing: '0ms',
    desc: 'WebRTC / SIP inbound carrier audio stream captured in 16kHz PCM Opus format.',
    badge: 'VoLTE / Twilio',
  },
  {
    title: '2. Silero VAD & Deepgram STT',
    timing: '42ms',
    desc: 'Instant voice activity detection with real-time word boundary recognition.',
    badge: 'Edge VAD',
  },
  {
    title: '3. LLM Reasoning Core',
    timing: '112ms',
    desc: 'Parallel execution across Google Gemini 2.5 Flash & local Ollama models with function calling.',
    badge: 'Gemini + Ollama',
  },
  {
    title: '4. Neural TTS Synthesis',
    timing: '175ms',
    desc: 'Ultra-low latency multilingual neural vocalizer emitting audio frames back to the caller.',
    badge: 'Multilingual TTS',
  },
];

const CODE_SNIPPET = `import { BizoraVoiceClient } from '@bizora/voice-sdk';

const client = new BizoraVoiceClient({
  apiKey: process.env.BIZORA_API_KEY,
  telephony: 'twilio-byot' // or 'gsm-gateway'
});

// Create autonomous voice assistant with Marathi + Hindi support
const assistant = await client.assistants.create({
  name: 'Hotel Concierge',
  model: 'gemini-2.5-flash',
  voiceId: 'neural-hindi-female-1',
  systemPrompt: 'You are a polite hotel concierge answering incoming guest calls.',
  maxDurationSeconds: 600,
  tools: ['check_room_availability', 'book_reservation']
});

console.log('Assistant deployed with 329ms latency:', assistant.id);`;

export default function EliteLandingPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [monthlyCalls, setMonthlyCalls] = useState(5000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [voiceCoreState, setVoiceCoreState] = useState<VoiceCoreState>('idle');
  const [copiedCode, setCopiedCode] = useState(false);

  // Cost calculation
  const vapiCost = monthlyCalls * 3 * 18; // approx ₹18/min ($0.20) for 3-minute calls
  const vaaniCost = 299; // ₹299 unlimited domestic SIM
  const yearlySavings = (vapiCost - vaaniCost) * 12;

  useEffect(() => {
    setCurrentUser(getStoredUser());
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (!stored && prefersDark) || stored === null;
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handlePlayVoice = (persona: Persona) => {
    setActivePersona(persona);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlaying && activePersona.id === persona.id) {
        setIsPlaying(false);
        setVoiceCoreState('idle');
        return;
      }
      setIsPlaying(true);
      setVoiceCoreState('speaking');
      const utterance = new SpeechSynthesisUtterance(persona.audioText);
      utterance.rate = 0.95;
      utterance.onend = () => {
        setIsPlaying(false);
        setVoiceCoreState('idle');
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setVoiceCoreState('idle');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(true);
      setVoiceCoreState('speaking');
      setTimeout(() => {
        setIsPlaying(false);
        setVoiceCoreState('idle');
      }, 2500);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-obsidian-canvas text-text-primary transition-colors">
      {/* ── 1. CINEMATIC OBSIDIAN HEADER ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-obsidian-canvas/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-text-secondary">
            <a href="#voice-core" className="hover:text-amber-500 transition">
              The Voice Core
            </a>
            <a href="#pipeline" className="hover:text-amber-500 transition">
              329ms Architecture
            </a>
            <a href="#listen-voices" className="hover:text-amber-500 transition">
              Neural Voices
            </a>
            <a href="#vapi-comparison" className="hover:text-amber-500 transition">
              vs Vapi.ai
            </a>
            <a href="#savings" className="hover:text-amber-500 transition">
              Cost Economics
            </a>
            <a href="#developers" className="hover:text-amber-500 transition">
              Developers & SDK
            </a>
            <a href="#faq" className="hover:text-amber-500 transition">
              FAQ
            </a>
          </nav>

          {/* Actions & Theme Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              title={isDark ? 'Switch to Warm Ivory Light Mode' : 'Switch to Sonic Obsidian Dark Mode'}
              className="p-2 rounded-xl border border-border-subtle bg-obsidian-surface text-text-secondary hover:text-text-primary hover:border-border-medium transition"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-medium hidden sm:inline">
                  Hi, <strong>{currentUser.name}</strong>
                </span>
                <Link
                  href="/agents"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-sm"
                >
                  Open Studio
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary px-2.5 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Launch Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO: THE VOICE CORE & ACOUSTIC INTELLIGENCE ─────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border-subtle overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(230,154,72,0.12)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Telemetry Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-surface border border-border-medium text-text-secondary text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-text-primary font-semibold">Sub-329ms Voice Telephony</span>
                <span className="text-text-tertiary">•</span>
                <span className="text-amber-500 font-medium">Gemini 2.5 + Local Ollama</span>
              </div>

              {/* Master Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.08]">
                The Voice AI Platform Built for{' '}
                <span className="text-amber-500 dark:text-[#E69A48]">
                  Sub-Second Telephony.
                </span>
              </h1>

              {/* Precise Subtitle */}
              <p className="text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
                Build, test, and deploy ultra-low latency voice agents for inbound support and bulk outbound campaigns.
                Speaks fluent <strong className="text-text-primary">Marathi, Hindi, Gujarati, and Indian English</strong> with direct Twilio BYOT and zero per-minute cloud markups.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href={currentUser ? "/agents" : "/signup"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-sm transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{currentUser ? "Open Assistant Studio" : "Start Building Free"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/call"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border-medium bg-obsidian-surface hover:bg-obsidian-hover text-text-primary font-semibold text-sm transition shadow-sm"
                >
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>Test Voice Playground</span>
                </Link>

                <a
                  href="#listen-voices"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary font-medium text-sm transition"
                >
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span>Hear Neural Demos</span>
                </a>
              </div>

              {/* Verification Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border-subtle text-xs font-mono text-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>329ms Total Pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Twilio BYOT Import</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Zero OTP Blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Postgres Self-Hosted</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Voice Core Visualizer & Interactive States */}
            <div id="voice-core" className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md p-6 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-semibold text-text-primary">
                      SONIC OBSIDIAN CORE
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-text-tertiary">16kHz PCM Opus</span>
                </div>

                {/* The 3D Voice Core Object */}
                <div className="flex items-center justify-center py-2">
                  <VoiceCore3D
                    state={voiceCoreState}
                    audioLevel={isPlaying ? 0.8 : 0.2}
                    size={260}
                    interactive={true}
                    onStateClick={() => {
                      const states: VoiceCoreState[] = ['idle', 'listening', 'processing', 'speaking'];
                      const nextIndex = (states.indexOf(voiceCoreState) + 1) % states.length;
                      setVoiceCoreState(states[nextIndex]);
                    }}
                  />
                </div>

                {/* State Controller Buttons for interactive preview */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-text-tertiary text-center">
                    Interactive Acoustic States
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['idle', 'listening', 'processing', 'speaking'] as VoiceCoreState[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setVoiceCoreState(st)}
                        className={`py-1.5 rounded-lg text-[10px] font-mono uppercase font-semibold transition ${
                          voiceCoreState === st
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs'
                            : 'bg-obsidian-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Telemetry Breakdown */}
                <div className="p-3 rounded-xl bg-obsidian-elevated border border-border-subtle text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between text-text-tertiary">
                    <span>Voice Activity Detection (VAD)</span>
                    <span className="text-text-primary">42ms</span>
                  </div>
                  <div className="flex justify-between text-text-tertiary">
                    <span>Gemini 2.5 Flash TTFT</span>
                    <span className="text-amber-500">112ms</span>
                  </div>
                  <div className="flex justify-between text-text-tertiary">
                    <span>Neural Edge TTS Stream</span>
                    <span className="text-text-primary">175ms</span>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-bold border-t border-border-subtle pt-1.5">
                    <span>Total Latency (Audio-to-Audio)</span>
                    <span>329ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. 329MS PIPELINE ARCHITECTURE ─────────────────────────────────── */}
      <section id="pipeline" className="py-16 md:py-24 border-b border-border-subtle bg-obsidian-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-widest">
              Zero-Buffering Audio Telemetry
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              How BizoraVoice Delivers 329ms Voice Latency
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto">
              Conventional voice wrappers introduce 800ms+ lag by buffering audio chunks in cloud queues.
              Our streaming pipeline operates in synchronized micro-packets:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PIPELINE_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-obsidian-surface border border-border-subtle hover:border-border-medium transition space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {step.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-500">{step.timing}</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary pt-1">{step.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. REAL MULTILINGUAL VOICE DEMO ─────────────────────────────────── */}
      <section id="listen-voices" className="py-16 md:py-24 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold text-emerald-500 uppercase tracking-widest">
              Acoustic Benchmarks
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Natural Multilingual Neural Voices
            </h2>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              Trained on authentic conversational speech across Marathi, Hindi, Gujarati, and Indian English:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = activePersona.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePersona(p)}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-obsidian-elevated border-amber-500 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-obsidian-surface border-border-subtle hover:border-border-medium'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-obsidian-canvas border border-border-subtle flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-obsidian-canvas text-text-secondary border border-border-subtle">
                        {p.langName}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-text-primary">{p.name}</h4>
                      <p className="text-xs text-text-tertiary mt-0.5">{p.business}</p>
                    </div>

                    <p className="text-xs text-text-secondary italic p-2.5 rounded-xl bg-obsidian-canvas border border-border-subtle line-clamp-3">
                      {p.quote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoice(p);
                    }}
                    className={`mt-4 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSelected && isPlaying
                        ? 'bg-emerald-500 text-obsidian-canvas font-bold'
                        : 'bg-obsidian-canvas text-text-primary hover:bg-obsidian-hover border border-border-subtle'
                    }`}
                  >
                    {isSelected && isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Synthesizing Voice...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Play Voice Preview</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. DIRECT COMPARISON: BIZORAVOICE VS VAPI.AI ────────────────────── */}
      <section id="vapi-comparison" className="py-16 md:py-24 border-b border-border-subtle bg-obsidian-surface/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-widest">
              Architectural Showdown
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              BizoraVoice vs Vapi.ai Comparison
            </h2>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              How our sovereign architecture compares against conventional third-party US cloud wrappers:
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-obsidian-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-elevated border-b border-border-subtle text-text-secondary font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4 text-amber-500 font-bold">BizoraVoice (Sovereign)</th>
                  <th className="py-3 px-4 text-text-tertiary">Vapi.ai (US Cloud)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Voice Latency</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">329ms end-to-end</td>
                  <td className="py-3.5 px-4 font-mono text-text-tertiary">650ms – 900ms</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Per-Minute Calling Fees</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-500">
                    ₹0 / min (Standard ₹299/mo Unlimited SIM)
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary">$0.15 – $0.20 / min (~₹15/min)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Model Intelligence</td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    Google Gemini 2.5 Flash + Local Ollama
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary">Cloud OpenAI/Anthropic only</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Telephony Connectivity</td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    Twilio BYOT + Direct GSM 4G VoLTE Hardware
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary">Twilio cloud accounts only</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Data Privacy & Sovereignty</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-500">
                    100% Self-Hosted Supabase PostgreSQL
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary">Stored on US server infrastructure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. SAVINGS CALCULATOR ──────────────────────────────────────────── */}
      <section id="savings" className="py-16 md:py-24 border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Calculate Your Telephony Savings
            </h2>
            <p className="text-sm text-text-secondary">
              Drag the slider to calculate monthly cost savings compared to paying \$0.18/minute to cloud AI wrappers:
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-obsidian-surface border border-border-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-text-secondary">
                Estimated Monthly Outbound & Inbound Calls:
              </span>
              <span className="font-mono font-bold text-amber-500 text-base">
                {monthlyCalls.toLocaleString()} calls / month
              </span>
            </div>

            <input
              type="range"
              min={1000}
              max={30000}
              step={1000}
              value={monthlyCalls}
              onChange={(e) => setMonthlyCalls(Number(e.target.value))}
              className="w-full cursor-pointer h-2 bg-obsidian-elevated rounded-lg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-red-400 uppercase">
                  Vapi.ai / Bland.ai
                </span>
                <div className="text-2xl font-black text-red-400 font-mono">
                  ₹{vapiCost.toLocaleString()}
                </div>
                <p className="text-[10px] text-text-tertiary">At \$0.18/min billing</p>
              </div>

              <div className="p-4 rounded-xl bg-obsidian-elevated border border-border-subtle text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-text-secondary uppercase">
                  BizoraVoice Telephony
                </span>
                <div className="text-2xl font-black text-emerald-500 font-mono">
                  ₹{vaaniCost}
                </div>
                <p className="text-[10px] text-text-tertiary">Jio/Airtel ₹299 Unlimited SIM</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-amber-500 uppercase">
                  Net Annual Capital Saved
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  ₹{yearlySavings.toLocaleString()} / yr
                </div>
                <p className="text-[10px] text-amber-500/80 font-medium">
                  Direct capital retained in your business
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. DEVELOPER CODE TERMINAL ─────────────────────────────────────── */}
      <section id="developers" className="py-16 md:py-24 border-b border-border-subtle bg-obsidian-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-widest">
              Developer Ergonomics
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Programmable Voice in 5 Lines of Code
            </h2>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              Integrate real-time conversational agents into your Node.js or Python backend with full WebSocket and REST support:
            </p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-obsidian-surface overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-obsidian-elevated border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                </div>
                <span className="text-xs font-mono text-text-tertiary ml-2">assistant-create.ts</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono overflow-x-auto text-text-secondary leading-relaxed">
              <code>{CODE_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── 8. FAQS ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-24 border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-text-secondary">
              Everything you need to know about sovereign voice AI telephony:
            </p>
          </div>

          <div className="space-y-3">
            {SIMPLE_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border-subtle bg-obsidian-surface overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-text-primary cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-subtle pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 9. CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-obsidian-surface/60 text-center border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Ready to Build Sovereign Voice AI?
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Create your first assistant with Gemini Flash and test real voice conversations in our browser playground.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={currentUser ? "/agents" : "/signup"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-sm transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{currentUser ? "Open Assistant Studio" : "Launch Studio Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/call"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border-medium bg-obsidian-surface hover:bg-obsidian-hover text-text-primary font-semibold text-sm transition"
            >
              <span>Test Live Voice Playground</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-8 bg-obsidian-surface text-xs text-text-tertiary border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span className="font-semibold text-text-primary">BizoraVoice</span>
            <span>— Sovereign Audio Intelligence Infrastructure</span>
          </div>
          <div className="flex items-center gap-6 text-text-secondary">
            <Link href="/call" className="hover:text-amber-500">
              Voice Playground
            </Link>
            <Link href="/campaigns" className="hover:text-amber-500">
              Bulk Outbound
            </Link>
            <Link href="/numbers" className="hover:text-amber-500">
              Twilio BYOT
            </Link>
            <Link href="/developers" className="hover:text-amber-500">
              REST & WS API
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
