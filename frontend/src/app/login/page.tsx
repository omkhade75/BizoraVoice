'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Mail,
  Lock,
  Building,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { loginUser, registerUser, signInWithGoogleOAuth, AuthUser } from '@/lib/api';

function LoginFormContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialMode = pathname.includes('signup') || searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);

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
        router.push('/agents');
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        throw error;
      }
      // Browser redirects to Google OAuth
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed to initialize.');
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginUser('admin@bizoravoice.com', 'admin123');
      setSuccessUser(res.user);
      setTimeout(() => {
        router.push('/agents');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-canvas text-text-primary flex flex-col lg:flex-row relative overflow-hidden select-none">
      {/* Top Left Navigation Back */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-obsidian-surface hover:bg-obsidian-elevated border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition shadow-xs backdrop-blur"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* LEFT COLUMN: Hero Pitch & Credentials (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-obsidian-surface/60 p-12 lg:p-16 flex-col justify-between border-r border-border-subtle relative">
        <div className="absolute top-1/4 left-1/4 -z-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="pt-8">
          <BrandLogo size="lg" />
        </div>

        {/* Core Value Pitch */}
        <div className="space-y-6 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sovereign Voice Telephony • Sub-329ms</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
            Stop paying \$0.20/minute for American cloud wrappers.
          </h2>

          <p className="text-sm text-text-secondary leading-relaxed">
            Deploy self-hosted AI receptionists fluent in Marathi, Hindi, Gujarati, and English with direct 4G VoLTE SIM connectivity and 1-click Twilio number imports.
          </p>

          <div className="space-y-3 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Free Bulk Outbound Dialer with zero OTP blocks</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sub-329ms conversational turnarounds with Silero VAD</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bring your own Twilio numbers or Jio ₹299/mo unlimited SIM</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Stamp */}
        <div className="flex items-center justify-between text-xs text-text-tertiary font-mono pt-6 border-t border-border-subtle">
          <span>SECURE SUPABASE AUTH</span>
          <span className="text-amber-500 font-semibold">SOVEREIGN POSTGRES</span>
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
          <div className="p-7 sm:p-8 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-xl space-y-6">
            {/* Header & Mode Switcher */}
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {mode === 'signup' ? 'Get Started for Free' : 'Sign in to Studio'}
              </h1>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                {mode === 'signup'
                  ? 'Create your free account. No credit card required.'
                  : 'Access your AI assistants, squads, and phone dialer'}
              </p>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-obsidian-elevated border border-border-subtle text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2 rounded-lg transition ${
                    mode === 'login'
                      ? 'bg-obsidian-surface text-text-primary shadow-xs font-bold'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-2 rounded-lg transition ${
                    mode === 'signup'
                      ? 'bg-amber-500 text-obsidian-canvas font-bold shadow-xs'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 font-mono">
                {errorMsg}
              </div>
            )}

            {/* SUCCESS BANNER */}
            {successUser && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Welcome, {successUser.name}!</div>
                  <div className="text-[11px] text-emerald-400/80">Redirecting to your voice studio...</div>
                </div>
              </div>
            )}

            {/* 1. CONTINUE WITH GOOGLE */}
            <div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading || !!successUser}
                className="w-full py-3 px-4 rounded-xl border border-border-subtle hover:border-border-medium bg-obsidian-elevated hover:bg-obsidian-hover text-text-primary font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-50 active:scale-[0.99] cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
            </div>

            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <div className="h-px bg-border-subtle flex-1" />
              <span>or with email</span>
              <div className="h-px bg-border-subtle flex-1" />
            </div>

            {/* 2. EMAIL FORM */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Om Khade"
                        className="w-full pl-9 pr-3 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Company / Organization
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Bizora Logistics"
                        className="w-full pl-9 pr-3 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="om@company.in"
                    className="w-full pl-9 pr-3 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!successUser}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* 3. ONE-CLICK DEMO ACCESS */}
            <div className="pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading || !!successUser}
                className="w-full py-2.5 px-3 rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15 text-amber-500 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Demo Access (1-Click Preview)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian-canvas" />}>
      <LoginFormContent />
    </Suspense>
  );
}
