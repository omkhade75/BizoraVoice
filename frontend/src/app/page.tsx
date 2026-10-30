'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Pause,
  Phone,
  Building2,
  Stethoscope,
  Wheat,
  Truck,
  Check,
  Mic,
  Activity,
  Layers,
  Radio,
  Hash,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
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
    q: 'What is Vaani Voice?',
    a: 'Vaani Voice is an AI-powered voice phone system for businesses. It answers incoming customer calls 24/7 and makes automated outbound calls in fluent Marathi, Hindi, Gujarati, and Indian English.',
  },
  {
    q: 'How does it save money compared to Vapi.ai or Bland.ai?',
    a: 'Vapi and Bland charge $0.15 to $0.20 per minute (~₹12 to ₹18/min). Vaani Voice runs self-hosted on your own computer or server and uses standard unlimited domestic SIMs (like Jio/Airtel at ₹299/month), giving you unlimited calling with zero per-minute fees.',
  },
  {
    q: 'Why do outbound calls work without recipient OTP verification?',
    a: 'American cloud platforms like Twilio trial accounts require recipients to pre-verify OTPs before receiving calls. By connecting to standard 4G VoLTE GSM gateways, Vaani Voice dials any regular Indian phone number directly with no OTP verification blocks.',
  },
  {
    q: 'Can I connect my existing Twilio number?',
    a: 'Yes! Vaani Voice includes 1-click Twilio import. Enter your Twilio credentials to import your numbers and route incoming calls directly to your chosen AI persona.',
  },
];

export default function SimpleLandingPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [monthlyCalls, setMonthlyCalls] = useState(5000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Cost calculation
  const vapiCost = monthlyCalls * 3 * 18; // approx ₹18/min ($0.20) for 3-minute calls
  const vaaniCost = 299; // ₹299 unlimited domestic SIM
  const yearlySavings = (vapiCost - vaaniCost) * 12;

  useEffect(() => {
    setCurrentUser(getStoredUser());
    // Detect theme
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
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
        return;
      }
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(persona.audioText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 2500);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* ── 1. CLEAN NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <a href="#what-it-does" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              What It Does
            </a>
            <a href="#listen-voices" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Hear Voice Demo
            </a>
            <a href="#savings" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Cost Savings
            </a>
            <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              How It Works
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              FAQ
            </a>
          </nav>

          {/* Action Buttons & Light/Dark Mode Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium hidden sm:inline">
                  Hi, <strong>{currentUser.name}</strong>
                </span>
                <Link
                  href="/call"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Voice Studio
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/call"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Try Voice Studio</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO: SIMPLE, CLEAN & REQUIRED INFORMATION ONLY ────────────── */}
      <section className="relative pt-12 pb-16 md:pt-18 md:pb-24 border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Clear Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Voice Calling for Indian Business</span>
          </div>

          {/* Simple Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.12]">
            AI Phone Caller & Receptionist{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              for Your Business
            </span>
          </h1>

          {/* Just Required Info */}
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Answers incoming customer calls 24/7 and dials automated outbound campaigns in fluent{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              Marathi, Hindi, Gujarati & English
            </strong>{' '}
            — with zero per-minute cloud fees and no recipient verification blocks.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/call"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-4 h-4" />
              <span>Launch Free Voice Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#listen-voices"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-850"
            >
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Hear Audio Sample</span>
            </a>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition hover:text-zinc-900 dark:hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span>Continue with Google</span>
            </Link>
          </div>

          {/* 4 Simple Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Speaks 4 Indian Languages
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ₹299/mo Unlimited Calling SIM
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Zero OTP Verification Blocks
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              100% Private & Self-Hosted
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. THE 3 REQUIRED THINGS THIS AI DOES ──────────────────────────── */}
      <section id="what-it-does" className="py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/60 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              What Can This AI Voice Platform Do?
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Simple, reliable voice automation built for shops, clinics, suppliers, and growing companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                1. 24/7 Inbound Receptionist
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Answers your business phone within seconds. Greets customers politely, answers questions, checks inventory, and books appointments while you sleep.
              </p>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
                ✓ Never miss another customer call
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                2. Bulk Outbound Phone Dialer
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Upload a spreadsheet of phone numbers. The AI automatically dials your contacts to confirm deliveries, collect pending payments, or share price updates.
              </p>
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 pt-1">
                ✓ No OTP verification locks on Indian mobiles
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                3. Zero Per-Minute Cloud Fees
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Runs self-hosted on your own computer or server using standard ₹299/month unlimited SIM cards. Say goodbye to paying \$0.18/minute to US cloud wrappers.
              </p>
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 pt-1">
                ✓ Saves ₹12+ Lakhs every year
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HEAR THE AI SPEAK (INTERACTIVE VOICE DEMO) ─────────────────── */}
      <section id="listen-voices" className="py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Interactive Audio Player
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Hear How Natural the AI Sounds
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Click any business below to hear the voice speak live in your browser:
            </p>
          </div>

          {/* 4 Voice Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = activePersona.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePersona(p)}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/60 dark:bg-zinc-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {p.langName}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{p.business}</p>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 italic p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 line-clamp-3">
                      {p.quote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoice(p);
                    }}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSelected && isPlaying
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isSelected && isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Playing Voice...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Listen to Voice</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. SIMPLE SAVINGS CALCULATOR ──────────────────────────────────── */}
      <section id="savings" className="py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/60 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              How Much Money Do You Save?
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Drag the slider to see your real savings compared to paying \$0.18/minute to cloud AI wrappers:
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Estimated Monthly Customer Calls:
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-base">
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
              className="w-full accent-emerald-600 cursor-pointer h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-zinc-950 border border-red-200 dark:border-red-900/40 text-center space-y-1">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase">
                  Other Cloud AI (Monthly)
                </span>
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  ₹{vapiCost.toLocaleString()}
                </div>
                <p className="text-[10px] text-zinc-500">Based on \$0.18/min billing</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                  Vaani Voice (Monthly)
                </span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  ₹{vaaniCost}
                </div>
                <p className="text-[10px] text-zinc-500">Jio/Airtel ₹299 Unlimited SIM</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-zinc-900 border border-emerald-300 dark:border-emerald-700 text-center space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                  Net Annual Savings
                </span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 font-mono">
                  ₹{yearlySavings.toLocaleString()} / yr
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                  Direct profit saved in your bank
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS (3 SIMPLE STEPS) ──────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              How It Works in 3 Simple Steps
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Get your automated voice phone system up and running in minutes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Choose or Create an AI Persona
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pick a pre-configured persona for hotels, hospitals, mandis, or write your own custom greeting and instructions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Connect Your Phone Number
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Connect standard domestic 4G SIM cards for unlimited domestic calls, or import your Twilio numbers with 1 click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Let the AI Answer & Dial
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Customers who call you get immediate assistance. Or upload a contact list to dial automated outbound campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SIMPLE FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/60 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Clear answers to the most common questions:
            </p>
          </div>

          <div className="space-y-3">
            {SIMPLE_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. BOTTOM CALL TO ACTION ───────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white dark:bg-zinc-950 text-center border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Ready to Automate Your Business Phone Calls?
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Test the live microphone voice studio for free with zero setup or credit cards.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/call"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-4 h-4" />
              <span>Open Voice Studio Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-850"
            >
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. SIMPLE FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-8 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Vaani Voice (वाणी)
            </span>
            <span>— Sovereign Voice AI Telephony</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/call" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Voice Studio
            </Link>
            <Link href="/campaigns" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Bulk Dialer
            </Link>
            <Link href="/numbers" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Phone Numbers
            </Link>
            <a
              href="https://github.com/omkhade75/BizoraVoice.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
