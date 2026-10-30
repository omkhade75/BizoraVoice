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
  ChevronDown,
  ChevronUp,
  Lock,
  Headphones,
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
    greetingText:
      '“Namaste! Welcome to Taj Residency. How may I assist you with your luxury room reservation or table dining today?”',
    audioSampleText:
      'नमस्ते! ताज रेसिडेंसी में आपका स्वागत है। क्या मैं आपके लिए कमरा बुक करूँ या कोई अन्य सहायता करूँ?',
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
    greetingText:
      '“नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील लाल कांद्याचे आणि खतांचे दर जाणून घेण्यासाठी बोला.”',
    audioSampleText:
      'नमस्कार! आज नाशिक मार्केटमध्ये कांद्याला प्रति क्विंटल २,४५० रुपये भाव आहे. आपल्याला खतांची ऑर्डर द्यायची आहे का?',
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
    greetingText:
      '“Hello! Dr. Patil Dental Clinic. Are you calling for teeth cleaning, root canal, or emergency consultation?”',
    audioSampleText:
      'नमस्ते! डॉ. पाटिल डेंटल क्लिनिक में आपका स्वागत है। क्या आप रूट कैनाल या दाँतों की जाँच के लिए अपॉइंटमेंट बुक करना चाहते हैं?',
    accent: 'Empathetic & Professional',
    agentId: 'patil-dental',
  },
  {
    id: 'apmc-logistics',
    name: 'APMC Wholesale Logistics',
    role: 'Truck Dispatch & Bulk Grain Delivery',
    industry: 'Supply Chain',
    language: 'Indian English',
    langTag: 'EN',
    icon: Truck,
    greetingText:
      '“Namaste! APMC Wholesale Logistics. Inquiring about truck freight transit or bulk grain dispatch status?”',
    audioSampleText:
      'Namaste! APMC Wholesale Logistics dispatch desk. 40 metric tonnes of grain have departed Navi Mumbai warehouse and will arrive by 5 PM.',
    accent: 'Fast, Efficient & Clear',
    agentId: 'apmc-mandi',
  },
  {
    id: 'chai-tapri',
    name: 'Chai Tapri UPI Voice Alert',
    role: 'Instant Spoken QR Payment Confirmation',
    industry: 'Retail & MSME',
    language: 'Hinglish',
    langTag: 'HI',
    icon: Coffee,
    greetingText:
      '“Payment Received! ₹30 received on PhonePe QR. Shukriya, have a refreshing cutting chai!”',
    audioSampleText:
      'फोनपे पर तीस रुपये प्राप्त हुए! शुक्रिया, आपकी स्पेशल कटिंग चाय तैयार है!',
    accent: 'Lively Street Vendor',
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
    name: '1. Ingestion',
    tech: 'Direct Twilio Stream / 4G GSM',
    latency: '24 ms',
    cost: '₹0.00 / min',
    description:
      'Ingests bi-directional 16kHz audio directly from Twilio Media Streams or local 4G VoLTE GSM Gateways without US cloud proxies.',
    icon: PhoneForwarded,
  },
  {
    id: 'vad',
    name: '2. Voice Activity',
    tech: 'Silero VAD (ONNX)',
    latency: '15 ms',
    cost: '₹0.00 (Local CPU)',
    description:
      'Instantly detects human speech and speech boundaries. Handles sub-second barge-in and human interruptions naturally.',
    icon: Mic,
  },
  {
    id: 'stt',
    name: '3. Speech-to-Text',
    tech: 'faster-whisper (int8)',
    latency: '85 ms',
    cost: '₹0.00 (Local Hardware)',
    description:
      'Transcribes Marathi, Hindi, Gujarati, and Indian English with specialized acoustic weights for regional vocabulary and accents.',
    icon: Activity,
  },
  {
    id: 'llm',
    name: '4. Reasoning',
    tech: 'Qwen 2.5 7B / DeepSeek',
    latency: '110 ms',
    cost: '₹0.00 (Ollama Local)',
    description:
      'Streams tokens with zero temperature hallucination. Follows strict system prompts, tool calls, and structured business logic.',
    icon: Cpu,
  },
  {
    id: 'tts',
    name: '5. Neural Synthesis',
    tech: 'Kokoro ONNX / Indic Neural',
    latency: '95 ms',
    cost: '₹0.00 (Local ONNX)',
    description:
      'Synthesizes 24kHz HD human-grade voice in Swara (Hindi), Aarohi (Marathi), Dhwani (Gujarati), and Neerja (Indian English).',
    icon: Volume2,
  },
];

const FAQS = [
  {
    q: 'How does Vaani Voice eliminate the $0.18/minute fee of Vapi.ai and Bland.ai?',
    a: 'Vapi and Bland act as third-party cloud wrappers over OpenAI, ElevenLabs, and Twilio, adding a hefty 40-60% per-minute margin. Vaani Voice runs the entire pipeline—Silero VAD, faster-whisper STT, local Qwen LLM, and Kokoro Neural TTS—100% self-hosted on your own hardware or server. There are zero per-minute cloud bills.',
  },
  {
    q: 'Why do outbound calls work without recipient OTP verification?',
    a: 'Twilio trial or sandbox accounts restrict outbound calls to pre-verified numbers via OTP. Vaani Voice integrates with direct physical 4G VoLTE GSM hardware gateways (Dinstar, Wavecom, GoIP). By using standard domestic SIMs (Jio/Airtel unlimited at ₹299/month), it dials any Indian mobile phone number directly with zero verification blocks.',
  },
  {
    q: 'Can I connect my existing Twilio phone numbers?',
    a: 'Yes! Vaani Voice features a 1-Click Twilio Import engine. Simply enter your Twilio Account SID and Auth Token, and it automatically discovers your numbers, imports them, and configures bi-directional media stream webhooks.',
  },
  {
    q: 'Which Indian languages and accents are natively supported?',
    a: 'Vaani Voice includes production neural models for Marathi (मराठी), Hindi (हिन्दी), Gujarati (ગુજરાતી), and Indian English, with custom vocabulary tuned for APMC agricultural mandi rates, healthcare triage, and commerce.',
  },
  {
    q: 'What is the end-to-end conversational latency?',
    a: 'Total turnaround time from when the caller finishes speaking to when the AI voice replies is approximately ~329ms (Ingestion 24ms + VAD 15ms + STT 85ms + LLM 110ms + TTS 95ms), well within the natural human conversational threshold.',
  },
  {
    q: 'Can I integrate Vaani Voice into my existing web or mobile app?',
    a: 'Yes, just like Vapi.ai! You can use our REST API (`POST /api/calls/start`), WebSocket binary audio streaming, or embed our copy-paste React component directly into your web dashboard or mobile app.',
  },
];

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activePersona, setActivePersona] = useState<PersonaDemo>(PERSONA_DEMOS[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<PipelineStage>(PIPELINE_STAGES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    {
      speaker: 'Assistant',
      text: 'Namaste! Welcome to Taj Residency. How may I assist you with your reservation today?',
    },
    {
      speaker: 'Customer',
      text: 'Namaste, do you have a Deluxe Lake View suite available this Saturday?',
    },
    {
      speaker: 'Assistant',
      text: 'Certainly sir! We have 2 Lake View suites available for this Saturday at ₹14,500 plus taxes. Shall I reserve one under your number?',
    },
    {
      speaker: 'Customer',
      text: 'Yes please, and kindly add complimentary breakfast.',
    },
    {
      speaker: 'Assistant',
      text: 'Done! Your reservation is confirmed with breakfast at The Verandah. I have sent an SMS receipt to your mobile.',
    },
  ];

  useEffect(() => {
    setCurrentUser(getStoredUser());
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
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── 1. STICKY TOP NAVIGATION BAR ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo with acoustic wave mark */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <BrandLogo size="md" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sovereign Voice Telephony
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <a href="#features" className="hover:text-emerald-400 transition">
              Features
            </a>
            <a href="#audio-demos" className="hover:text-emerald-400 transition">
              Live Audio
            </a>
            <a href="#architecture" className="hover:text-emerald-400 transition">
              Architecture (329ms)
            </a>
            <a href="#calculator" className="hover:text-emerald-400 transition">
              Cost Calculator
            </a>
            <a href="#comparison" className="hover:text-emerald-400 transition">
              vs Vapi.ai
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              FAQ
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-300 font-medium hidden sm:inline">
                  Welcome back, <strong className="text-emerald-400">{currentUser.name}</strong>
                </span>
                <Link
                  href="/call"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Open Voice Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition px-2.5 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/call"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs transition shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION (FULL WIDTH & ATTENTION-GRABBING) ──────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-18 md:pb-28 border-b border-zinc-900">
        {/* Ambient radial glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Bold Copy & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Free Bulk Outbound Telephony • Zero OTP Pre-Verification Blocks</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-100 leading-[1.08]">
                The Voice AI Platform Built for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
                  Real Indian Business.
                </span>
              </h1>

              {/* Refined Subtitle */}
              <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed font-normal">
                Answers incoming customer calls in sub-seconds, speaks fluent{' '}
                <strong className="text-white font-semibold underline decoration-emerald-500/50 underline-offset-4">
                  Marathi, Hindi, Gujarati, and Indian English
                </strong>
                , and dials thousands of leads automatically with zero per-minute cloud fees or recipient OTP locks.
              </p>

              {/* Primary Call-to-Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/call"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm transition-all shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                  <span>Launch Free Voice Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#audio-demos"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Hear Voice Demos</span>
                </a>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold text-sm transition hover:text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Link>
              </div>

              {/* Trust Indicators Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80 text-[11px] font-semibold text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>₹299/mo Unlimited Calling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero OTP Pre-Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-340ms Voice Latency</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% On-Premise Privacy</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Simulated Phone Call Telemetry Console */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase tracking-wider">
                      LIVE CALL TELEMETRY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    4G VoLTE ACTIVE
                  </span>
                </div>

                {/* Simulated Phone Card */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-zinc-100 font-mono">+91 98200 11223</div>
                      <div className="text-[11px] text-zinc-400">Incoming Caller • Mumbai, MH</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-emerald-400">01:42</span>
                    <div className="text-[9px] text-zinc-500">16kHz PCM</div>
                  </div>
                </div>

                {/* Real-Time Waveform Equalizer */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      Live Spoken Dialogue
                    </span>
                    <span className="font-mono text-amber-400 text-[10px]">
                      Turn {simulatedTurnIndex + 1} of 5
                    </span>
                  </div>

                  {/* Equalizer Bars */}
                  <div className="h-10 flex items-center justify-center gap-1.5 py-1">
                    {[40, 75, 95, 60, 85, 100, 70, 90, 50, 80, 65, 45, 90, 55, 70].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className="w-1.5 rounded-full bg-emerald-400/80 transition-all duration-150 animate-pulse"
                      />
                    ))}
                  </div>

                  {/* Live Spoken Transcript */}
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-300 italic min-h-[58px] flex items-center">
                    <span>
                      <strong className="text-emerald-400 not-italic font-bold mr-1.5">
                        {SIMULATED_DIALOGUE[simulatedTurnIndex].speaker}:
                      </strong>
                      “{SIMULATED_DIALOGUE[simulatedTurnIndex].text}”
                    </span>
                  </div>
                </div>

                {/* Interactive Conversation Stepper */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block text-left">
                    Click to test conversation steps:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['1. Greeting', '2. Query', '3. Booking'].map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTriggerSimulatedDialogue(idx)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition border ${
                          simulatedTurnIndex === idx
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href="/call"
                  className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                >
                  <span>Speak to AI Live in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUSTED PROVIDERS & TICKER ─────────────────────────────────── */}
      <section className="w-full border-b border-zinc-900 bg-zinc-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Powered by Sovereign Hardware & Dual Physical Telephony
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-zinc-300 font-semibold text-xs opacity-80">
            <span className="flex items-center gap-2">
              <Wheat className="w-4 h-4 text-emerald-400" />
              Maharashtra APMC Mandis
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Taj & Trident Hospitality
            </span>
            <span className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              Dr. Patil Dental Clinics
            </span>
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Reliance Jio 4G VoLTE
            </span>
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              Airtel Business Gateway
            </span>
            <span className="flex items-center gap-2">
              <PhoneForwarded className="w-4 h-4 text-red-400" />
              Twilio Media Streams
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE 5-PERSONA AUDIO SWITCHBOARD ──────────────────────── */}
      <section id="audio-demos" className="w-full py-20 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold mb-2">
                24KHZ HD NEURAL INDIC VOICES
              </div>
              <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
                Listen to Indian Voice Receptionists in Action
              </h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Click any agent to listen to their spoken voice script, verify authentic regional accents, and deploy them with 1 click.
              </p>
            </div>

            <Link
              href="/agents"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition shrink-0"
            >
              <span>Explore All 5 Personas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PERSONA_DEMOS.map((persona) => {
              const Icon = persona.icon;
              const isSelected = activePersona.id === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setActivePersona(persona)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
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

                    <span className="text-[10px] text-amber-400 font-mono font-semibold block uppercase">
                      {persona.industry}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-100 mt-1 leading-snug">
                      {persona.name}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      {persona.role}
                    </p>

                    <p className="text-xs text-zinc-300 italic mt-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/70 line-clamp-3 leading-relaxed">
                      {persona.greetingText}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 truncate max-w-[85px]">
                      {persona.accent.split(' ')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySample(persona);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isSelected && isPlayingPreview
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isSelected && isPlayingPreview ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Playing</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. FULL-DUPLEX LATENCY PIPELINE (329 MS) ───────────────────────── */}
      <section id="architecture" className="w-full py-20 border-b border-zinc-900 bg-zinc-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold mb-2">
                SUB-400MS FULL-DUPLEX ENGINE
              </div>
              <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
                Engineered for Real-Time Human Conversational Speed
              </h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Every stage runs locally or on sovereign edge nodes, eliminating cross-continent API roundtrips.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-400 font-mono">End-to-End Latency:</span>
              <span className="text-base font-black font-mono text-emerald-400">~329 ms</span>
            </div>
          </div>

          {/* 5 Pipeline Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {PIPELINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isSelected = selectedPipelineStage.id === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedPipelineStage(stage)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {stage.latency}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">{stage.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1 truncate">{stage.tech}</p>
                </button>
              );
            })}
          </div>

          {/* Detailed Active Stage Box */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  Stage Details & Verification
                </span>
                <h3 className="text-lg font-bold text-zinc-100 mt-0.5">
                  {selectedPipelineStage.name} — {selectedPipelineStage.tech}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-zinc-400">
                  Stage Latency: <strong className="text-emerald-400">{selectedPipelineStage.latency}</strong>
                </span>
                <span className="text-zinc-400">
                  Cloud Markup: <strong className="text-emerald-400">{selectedPipelineStage.cost}</strong>
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-4xl">
              {selectedPipelineStage.description}
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE CLOUD COST CALCULATOR ────────────────────────────── */}
      <section id="calculator" className="w-full py-20 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold mb-2">
                REAL BUSINESS ROI
              </div>
              <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
                Interactive Cloud Cost Savings Calculator
              </h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Compare paying \$0.18/minute to American SaaS wrappers vs. running sovereign on Vaani Voice.
              </p>
            </div>

            <span className="text-xs font-bold text-emerald-400 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
              <Check className="w-4 h-4" />
              <span>99.8% Cost Savings Retained</span>
            </span>
          </div>

          {/* Draggable Slider & Cost Comparison */}
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-emerald-500/30 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="text-zinc-200 font-semibold">Select Monthly Outbound/Inbound Phone Calls:</span>
              <span className="font-mono text-emerald-400 font-bold text-base">
                {monthlyCalls.toLocaleString()} calls / month ({(monthlyCalls * avgCallMinutes).toLocaleString()} voice mins)
              </span>
            </div>

            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={monthlyCalls}
              onChange={(e) => setMonthlyCalls(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-3 bg-zinc-950 rounded-lg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3">
              {/* Vapi.ai Box */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-red-500/30 space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Vapi.ai Cloud Bill (Monthly)
                </span>
                <div className="text-3xl font-black text-red-400">
                  ₹{vapiMonthlyTotal.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-400 pt-1">
                  \$0.20/min markup + ElevenLabs TTS + OpenAI token fees
                </p>
              </div>

              {/* Vaani Voice Box */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/40 space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Vaani Voice (Monthly)
                </span>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{vaaniMonthlyTotal.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-400/90 pt-1">
                  ₹0 AI inference + ₹299 Jio Unlimited Calling SIM
                </p>
              </div>

              {/* Net Annual Savings */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent border border-emerald-500/50 space-y-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Net Annual Business Savings
                </span>
                <div className="text-3xl font-black text-emerald-200 font-mono">
                  ₹{annualSavings.toLocaleString()} / yr
                </div>
                <p className="text-xs text-emerald-300/80 pt-1">
                  100% retained profit in your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SIDE-BY-SIDE VAPI VS VAANI COMPARISON ────────────────────────── */}
      <section id="comparison" className="w-full py-20 border-b border-zinc-900 bg-zinc-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-left space-y-2 border-b border-zinc-800 pb-5">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
              <span>Enterprise Telephony Comparison: Vapi vs Vaani Voice</span>
            </h2>
            <p className="text-sm text-zinc-400 max-w-3xl">
              Why Indian enterprises choose sovereign voice infrastructure over US cloud wrappers.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase bg-zinc-900/90">
                  <th className="py-4 px-6">Capability</th>
                  <th className="py-4 px-6 text-emerald-400 font-bold">Vaani Voice (100% Sovereign)</th>
                  <th className="py-4 px-6 text-amber-400 font-bold">Vapi.ai (US Cloud SaaS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Bulk Outbound Calling</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">
                    100% Free & Unlimited on your own server
                  </td>
                  <td className="py-4 px-6 text-red-400/90">
                    Locked behind enterprise tier ($500+/mo) + per-min markup
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Recipient Phone Pre-Verification</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">
                    Zero OTP requirement. Dials regular Indian mobiles directly
                  </td>
                  <td className="py-4 px-6 text-red-400/90">
                    Blocks outbound calling unless recipient pre-verifies OTP
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Twilio Number Import (BYOT)</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">
                    1-Click direct import of existing Twilio landlines/toll-free
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    Requires custom enterprise billing contracts
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Regional Indic Voices</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">
                    Native Marathi, Hindi, Gujarati, Tamil (24kHz HD Neural)
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    Limited; requires costly third-party ElevenLabs API keys
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Platform Markup / Minute</td>
                  <td className="py-4 px-6 text-emerald-400 font-mono font-bold">
                    ₹0.00 / Free (100% Sovereign)
                  </td>
                  <td className="py-4 px-6 text-zinc-400 font-mono">
                    \$0.07 to \$0.20 per minute (~₹6 to ₹18/min)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-zinc-200">Data Sovereignty & Privacy</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">
                    100% on-premises. Audio & transcripts stay in your DB
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    Transcripts routed and stored on US third-party clouds
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 8. CORE PLATFORM PILLARS (6 FEATURE CARDS) ─────────────────────── */}
      <section id="features" className="w-full py-20 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-left space-y-2 border-b border-zinc-800 pb-5">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
              Enterprise Voice Telephony Capabilities
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Everything required to operate professional AI receptionists and bulk dialers at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/call"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Live Voice Studio</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Real-time microphone audio streaming over WebSockets with live waveforms and sub-second barge-in interruption.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 mt-6 flex items-center gap-1.5">
                <span>Open Voice Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/campaigns"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Bulk Phone Dialer</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Automated mass outbound phone calls from CSV contact lists with zero recipient pre-verification friction.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 mt-6 flex items-center gap-1.5">
                <span>Start Campaign</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/numbers"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Hash className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Twilio Import & 4G GSM</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  1-Click import for Twilio cloud numbers alongside direct physical 4G VoLTE GSM gateways using ₹299/mo domestic SIMs.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 mt-6 flex items-center gap-1.5">
                <span>Manage Numbers</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/agents"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Voice Receptionist Studio</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Design bespoke conversational AI personas with customized greetings, prompt parameters, and 24kHz HD neural voices.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 mt-6 flex items-center gap-1.5">
                <span>Configure Personas</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/outreach"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">WhatsApp & Voice Notes</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Generate local 24kHz `.wav` regional voice notes in Marathi or Hindi with bilingual transcripts and automated email RFQ dispatch.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 mt-6 flex items-center gap-1.5">
                <span>Dispatch Voice Notes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/developers"
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Developer API & SDKs</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Integrate Vaani Voice into any external web or mobile project with copyable cURL, Python SDK, Node.js, and WebSocket snippets.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-400 mt-6 flex items-center gap-1.5">
                <span>Developer Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. INTERACTIVE FAQ ACCORDION ───────────────────────────────────── */}
      <section id="faq" className="w-full py-20 border-b border-zinc-900 bg-zinc-950/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Everything you need to know about sovereign voice telephony and self-hosted deployment.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-100 cursor-pointer hover:bg-zinc-850/50 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. HIGH-IMPACT BOTTOM CTA BANNER ───────────────────────────────── */}
      <section className="w-full py-20 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-900 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-100">
            Stop Paying \$0.20/Minute to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              American Voice Wrappers.
            </span>
          </h2>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Deploy self-hosted multilingual voice telephony in 60 seconds. Unlimited calling, zero recipient OTP verification blocks, and complete data sovereignty.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/call"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm transition-all shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              <span>Launch Voice Studio Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm transition hover:scale-105 active:scale-95"
            >
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 11. ENTERPRISE FOOTER ───────────────────────────────────────────── */}
      <footer className="w-full bg-zinc-950 py-12 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-zinc-900 pb-10">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <span className="text-sm font-bold text-zinc-100">Vaani Voice (वाणी)</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                India's Sovereign Voice AI & Telephony Platform. 100% self-hosted replacement for Vapi.ai with native Marathi, Hindi, Gujarati, and English.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Edge CDN Live
                </span>
                <span className="text-zinc-400 text-[11px] font-mono">MIT Licensed</span>
              </div>
            </div>

            {/* Col 2: Telephony Modules */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Telephony
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/call" className="hover:text-emerald-400 transition">
                    Live Call Studio
                  </Link>
                </li>
                <li>
                  <Link href="/campaigns" className="hover:text-emerald-400 transition">
                    Bulk Phone Dialer
                  </Link>
                </li>
                <li>
                  <Link href="/numbers" className="hover:text-emerald-400 transition">
                    Twilio & 4G GSM
                  </Link>
                </li>
                <li>
                  <Link href="/history" className="hover:text-emerald-400 transition">
                    Call Recordings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Personas & Regional */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">
                AI Personas
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/agents" className="hover:text-emerald-400 transition">
                    Marathi Agro Advisor
                  </Link>
                </li>
                <li>
                  <Link href="/agents" className="hover:text-emerald-400 transition">
                    Taj Hotel Concierge
                  </Link>
                </li>
                <li>
                  <Link href="/agents" className="hover:text-emerald-400 transition">
                    Dr. Patil Dental Clinic
                  </Link>
                </li>
                <li>
                  <Link href="/outreach" className="hover:text-emerald-400 transition">
                    WhatsApp Voice Notes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Developers & Resources */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Developers
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/developers" className="hover:text-emerald-400 transition">
                    API Keys & SDKs
                  </Link>
                </li>
                <li>
                  <a
                    href="https://bizora-voice-backend.onrender.com/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 transition flex items-center gap-1"
                  >
                    <span>FastAPI Swagger</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/omkhade75/BizoraVoice.git"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 transition flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-400 text-[11px]">
            <div>
              © 2026 Vaani Voice (वाणी) by Om Khade. Distributed under the MIT License.
            </div>
            <div className="flex items-center gap-4">
              <span>Zero Cloud Markup</span>
              <span>•</span>
              <span>No Recipient OTP Verification Blocks</span>
              <span>•</span>
              <span>100% Data Sovereignty</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
