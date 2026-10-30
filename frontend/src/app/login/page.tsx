'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Building,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  PhoneCall,
  Check,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { loginUser, registerUser, googleLogin, AuthUser } from '@/lib/api';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);

  const GOOGLE_ACCOUNTS = [
    { email: 'omkhade75@gmail.com', name: 'Om Khade', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
    { email: 'founder@mybusiness.in', name: 'Business Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
  ];

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await registerUser(email, password, name, company);
        setSuccessUser(res.user);
      } else {
        const res = await loginUser(email, password);
        setSuccessUser(res.user);
      }
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (selectedEmail?: string, selectedName?: string) => {
    setErrorMsg(null);
    setGoogleLoading(true);

    try {
      const res = await googleLogin(selectedEmail, selectedName);
      setSuccessUser(res.user);
      setShowGooglePicker(false);
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row relative overflow-hidden select-none">
      {/* Top Left Navigation Back */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition shadow-sm backdrop-blur"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* LEFT COLUMN: Hero Pitch & Credentials (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-12 lg:p-16 flex-col justify-between border-r border-zinc-800/80 relative">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/4 -z-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="pt-8">
          <BrandLogo size="lg" />
        </div>

        {/* Core Value Pitch */}
        <div className="space-y-6 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sovereign Voice Telephony • Zero Cloud Taxes</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-zinc-100 leading-tight">
            Stop paying \$0.20/minute for American voice AI wrappers.
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Deploy self-hosted AI receptionists fluent in Marathi, Hindi, Gujarati, and English with direct 4G VoLTE SIM connectivity and 1-click Twilio number imports.
          </p>

          <div className="space-y-3 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Free Bulk Outbound Dialer with zero OTP blocks</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sub-400ms conversational turnarounds with Silero VAD</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bring your own Twilio numbers or Jio ₹299/mo unlimited SIM</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Stamp */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-6 border-t border-zinc-800/60">
          <span>SECURE AUTHENTICATION</span>
          <span className="text-emerald-400 font-semibold">SOVEREIGN ENCRYPTION</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Sign In / Register Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <BrandLogo size="md" />
          </div>

          {/* Main Card */}
          <div className="p-7 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-6">
            {/* Header & Mode Switcher */}
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">
                {mode === 'signup' ? 'Get Started for Free' : 'Welcome to Vaani Voice'}
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {mode === 'signup'
                  ? 'Create your free account. No credit card required.'
                  : 'Sign in to access your AI receptionists and phone dialer'}
              </p>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2 rounded-lg transition ${
                    mode === 'login'
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-2 rounded-lg transition ${
                    mode === 'signup'
                      ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* SUCCESS BANNER */}
            {successUser && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Welcome, {successUser.name}!</div>
                  <div className="text-[11px] text-emerald-400/80">Redirecting to your voice dashboard...</div>
                </div>
              </div>
            )}

            {/* 1. CONTINUE WITH GOOGLE (Primary Action) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowGooglePicker(!showGooglePicker)}
                disabled={googleLoading || loading || !!successUser}
                className="w-full py-3.5 px-4 rounded-xl border border-zinc-700/80 hover:border-zinc-500 bg-zinc-950 hover:bg-zinc-850 text-zinc-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md group cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Google Account Selector Dropdown Simulator */}
              {showGooglePicker && (
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 px-2 uppercase">
                    Choose a Google Account
                  </span>
                  <div className="space-y-1">
                    {GOOGLE_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleGoogleAuth(acc.email, acc.name)}
                        className="w-full p-2.5 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center gap-3 text-left transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {acc.name[0]}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-zinc-200">{acc.name}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{acc.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-800" />
              <span className="absolute px-3 bg-zinc-900 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Or with business email
              </span>
            </div>

            {/* 2. EMAIL / PASSWORD FORM */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Business or Organization
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Patil Healthcare & Clinic"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || !!successUser}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Disclaimer */}
            <div className="pt-2 text-center text-[11px] text-zinc-500 leading-relaxed">
              By continuing, you agree to self-hosted deployment terms. No third-party API keys required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm font-medium">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
          Loading workspace portal...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
