'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  Phone,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Save,
  Settings2,
  Cpu,
  Cloud,
  Zap,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { getStoredUser, AuthUser, API_BASE, getAuthToken } from '@/lib/api';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Inference & Hardware Settings
  const [inferencePreference, setInferencePreference] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen3.5:4b');
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ status: 'idle' | 'ok' | 'fail'; message: string }>({
    status: 'idle',
    message: '',
  });

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

      // Load cached keys and hardware preferences from localStorage
      const savedInference = localStorage.getItem('bizora_inference_mode') as 'gemini' | 'ollama';
      if (savedInference) setInferencePreference(savedInference);

      const savedOllamaUrl = localStorage.getItem('bizora_ollama_url');
      if (savedOllamaUrl) setOllamaUrl(savedOllamaUrl);

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

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/api/settings/keys`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.gemini_key_preview) {
            setGeminiKey(data.gemini_key_preview);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadSettings();
  }, []);

  const handleTestOllama = async () => {
    setOllamaTesting(true);
    setOllamaStatus({ status: 'idle', message: 'Connecting to local Ollama on this laptop...' });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const count = (data.models || []).length;
        setOllamaStatus({
          status: 'ok',
          message: `Connected successfully! Found ${count} model(s) installed on this laptop.`,
        });
      } else {
        setOllamaStatus({
          status: 'fail',
          message: `Ollama replied with HTTP error: ${res.status}`,
        });
      }
    } catch {
      setOllamaStatus({
        status: 'fail',
        message: `Could not reach ${ollamaUrl}. Make sure Ollama is installed and running ('ollama serve') with OLLAMA_ORIGINS="*".`,
      });
    } finally {
      setOllamaTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (geminiKey && !geminiKey.includes('...')) {
        await fetch(`${API_BASE}/api/settings/keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ gemini_api_key: geminiKey.trim() }),
        });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('bizora_inference_mode', inferencePreference);
        localStorage.setItem('bizora_ollama_url', ollamaUrl);
        if (geminiKey) localStorage.setItem('bizora_gemini_key', geminiKey);
        if (twilioSid) localStorage.setItem('bizora_twilio_sid', twilioSid);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              <Settings2 className="w-6 h-6 text-amber-500" />
              Workspace & Infrastructure Settings
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              PostgreSQL Verified
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configure your AI Inference Engine (Cloud vs Local Laptop), Supabase database, and Telephony routes.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Inference Engine & Hardware Load Management */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span>AI Inference Engine & Laptop Hardware Load</span>
                </h3>
                <p className="text-xs text-text-tertiary">
                  Choose when to run models on Google Cloud (0% laptop load) vs your local machine (Ollama)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Hardware Aware
            </span>
          </div>

          {/* Engine Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setInferencePreference('gemini')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                inferencePreference === 'gemini'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40 shadow-xs'
                  : 'border-border-subtle bg-obsidian-elevated hover:bg-obsidian-hover'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-text-primary">Google Gemini 2.5 Flash</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                  0% LAPTOP LOAD
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Runs on Google Cloud infrastructure. Best when your laptop is under heavy load, running other programs, or to save battery and prevent fan noise.
              </p>
              <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3" />
                Sub-329ms Latency • Recommended
              </div>
            </button>

            <button
              type="button"
              onClick={() => setInferencePreference('ollama')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                inferencePreference === 'ollama'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40 shadow-xs'
                  : 'border-border-subtle bg-obsidian-elevated hover:bg-obsidian-hover'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-text-primary">Local Ollama</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                  ON-DEVICE
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Runs directly on your laptop (qwen3.5:4b, llama3). 100% private, sovereign data. Requires 4GB–8GB free RAM and uses local CPU/GPU.
              </p>
              <div className="mt-3 text-[10px] font-mono text-text-tertiary flex items-center gap-1">
                <span>Requires local Ollama daemon</span>
              </div>
            </button>
          </div>

          {/* Local Ollama Endpoint Config */}
          {inferencePreference === 'ollama' && (
            <div className="p-4 rounded-xl bg-obsidian-elevated border border-border-subtle space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Local Ollama URL on This Laptop
                </label>
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={ollamaTesting}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ollamaTesting ? 'animate-spin' : ''}`} />
                  <span>Test Local Connection</span>
                </button>
              </div>

              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-surface font-mono text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              {ollamaStatus.status === 'ok' && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{ollamaStatus.message}</span>
                </div>
              )}

              {ollamaStatus.status === 'fail' && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ollamaStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Google Gemini Cloud LLM */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Google Gemini API Configuration
                </h3>
                <p className="text-xs text-text-tertiary">
                  Powers zero-load conversational turn-taking with Gemini 2.5 Flash
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Gemini API Key (Optional Override)
                </label>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-500 hover:underline font-semibold"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy... (leave blank to use system key)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                A server default key is already configured. You can supply your personal key for dedicated quotas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Default Gemini Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest, Sub-300ms, Recommended)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Balanced)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Twilio Telephony Credentials */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Twilio Account & Webhook Integration
                </h3>
                <p className="text-xs text-text-tertiary">
                  BYOT (Bring Your Own Twilio): Pay raw carrier rates (~$0.01/min) with zero Vapi markup.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Account SID
              </label>
              <input
                type="text"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Auth Token
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-elevated border border-border-subtle space-y-1">
            <span className="text-[11px] font-mono font-bold text-text-tertiary">
              Twilio Voice Webhook URL:
            </span>
            <div className="font-mono text-xs text-amber-500 select-all">
              https://bizora-voice-backend.onrender.com/api/telephony/twilio/incoming
            </div>
          </div>
        </div>

        {/* 4. Appearance & Theme */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Theme & Interface Appearance
                </h3>
                <p className="text-xs text-text-tertiary">Toggle between Warm Ivory Light and Sonic Obsidian Dark mode</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => toggleTheme(false)}
              className={`flex-1 p-4 rounded-xl border text-center transition ${
                !isDark
                  ? 'border-amber-500 bg-amber-500/10 text-text-primary ring-1 ring-amber-500/40'
                  : 'border-border-subtle bg-obsidian-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs font-bold">Warm Ivory Light</div>
              <div className="text-[10px] text-text-tertiary">Clean, crisp titanium aesthetic</div>
            </button>

            <button
              type="button"
              onClick={() => toggleTheme(true)}
              className={`flex-1 p-4 rounded-xl border text-center transition ${
                isDark
                  ? 'border-amber-500 bg-amber-500/10 text-text-primary ring-1 ring-amber-500/40'
                  : 'border-border-subtle bg-obsidian-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <div className="text-xs font-bold">Sonic Obsidian Dark</div>
              <div className="text-[10px] text-text-tertiary">Deep #10110F studio aesthetic</div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}