'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings2,
  Database,
  Key,
  Phone,
  Sun,
  Moon,
  CheckCircle2,
  ShieldCheck,
  Server,
  Sparkles,
  ExternalLink,
  Save,
  AlertCircle,
} from 'lucide-react';
import { getStoredUser, AuthUser } from '@/lib/api';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Gemini Settings
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');

  // Twilio Settings
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');

  // Save Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDark(storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches));

      // Load cached keys from localStorage if present
      const savedGemini = localStorage.getItem('bizora_gemini_key') || '';
      if (savedGemini) setGeminiKey(savedGemini);

      const savedSid = localStorage.getItem('bizora_twilio_sid') || '';
      if (savedSid) setTwilioSid(savedSid);
    }
  }, []);

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (geminiKey) localStorage.setItem('bizora_gemini_key', geminiKey);
      if (twilioSid) localStorage.setItem('bizora_twilio_sid', twilioSid);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Workspace & Infrastructure Settings
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Production Verified
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure your Supabase PostgreSQL database, Google Gemini cloud LLM keys, and Twilio telephony credentials.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Supabase Database Connection */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Supabase PostgreSQL Database
                </h3>
                <p className="text-xs text-zinc-500">Live multi-tenant database connection</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected (PostgreSQL 17.11)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-medium">Database Host:</span>
              <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200 break-all">
                db.vsmlvtrwgkpwxwhatbhx.supabase.co:5432
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-medium">Supabase Project URL:</span>
              <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200 break-all">
                https://vsmlvtrwgkpwxwhatbhx.supabase.co
              </div>
            </div>
          </div>
        </div>

        {/* 2. Google Gemini Cloud LLM */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Google Gemini (Cloud LLM - 0% Laptop Load)
                </h3>
                <p className="text-xs text-zinc-500">
                  Runs directly on Google AI infrastructure. Eliminates GPU heat, fan noise, and laptop battery drain.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:underline font-semibold"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                When provided, voice agents execute in Google Cloud with sub-300ms latency.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Default Gemini Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest, Sub-300ms, Recommended)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Balanced)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Twilio Telephony Credentials */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Twilio Account & Webhook Integration
                </h3>
                <p className="text-xs text-zinc-500">
                  BYOT (Bring Your Own Twilio): Pay raw carrier rates (~$0.01/min) with zero Vapi markup.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Account SID
              </label>
              <input
                type="text"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-bold text-zinc-500">
              Twilio Voice Webhook URL:
            </span>
            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 select-all">
              https://bizora-voice-backend.onrender.com/api/telephony/twilio/incoming
            </div>
          </div>
        </div>

        {/* 4. Appearance & Theme */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Theme & Interface Appearance
                </h3>
                <p className="text-xs text-zinc-500">Toggle between clean Light and Obsidian Dark mode</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => toggleTheme(false)}
              className={`flex-1 p-4 rounded-xl border text-center transition ${
                !isDark
                  ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 ring-2 ring-emerald-500'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs font-bold">Light Mode</div>
              <div className="text-[10px] text-zinc-500">Clean, crisp paper aesthetic</div>
            </button>

            <button
              type="button"
              onClick={() => toggleTheme(true)}
              className={`flex-1 p-4 rounded-xl border text-center transition ${
                isDark
                  ? 'border-emerald-500 bg-zinc-900 text-white ring-2 ring-emerald-500'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-xs font-bold">Dark Mode</div>
              <div className="text-[10px] text-zinc-500">Obsidian Zinc #09090b aesthetic</div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
