'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Cpu,
  Bot,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Building,
  Key,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { createAgent, saveUserSettings } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('Production Voice Hub');
  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'google_gemini'>('google_gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('mr-IN-AarohiNeural');
  const [agentName, setAgentName] = useState('Primary Customer Assistant');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save provider key if provided
      if (selectedProvider === 'google_gemini' && geminiApiKey.trim()) {
        await saveUserSettings({ gemini_api_key: geminiApiKey.trim() });
      }

      // 2. Create initial assistant
      await createAgent({
        name: agentName,
        description: 'First voice assistant configured during onboarding.',
        system_prompt:
          'You are a friendly, articulate, and intelligent voice assistant. Speak concisely in 1 to 2 sentences per turn.',
        voice: selectedVoice,
        model: selectedProvider === 'google_gemini' ? 'gemini-2.0-flash' : 'qwen3.5:4b',
        provider: selectedProvider,
        language: selectedVoice.startsWith('mr') ? 'mr' : 'hi',
        greeting_message: 'Namaste! How may I assist you today?',
        temperature: 0.7,
        max_duration_seconds: 600,
      });

      router.push('/agents');
    } catch {
      // Navigate to agents dashboard even if default assistant already exists
      router.push('/agents');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 md:p-12 selection:bg-emerald-500/20">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full pb-6 border-b border-zinc-800">
        <BrandLogo size="md" />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-emerald-500' : i < step ? 'w-2 bg-emerald-600' : 'w-2 bg-zinc-800'
              }`}
            />
          ))}
          <span className="text-xs text-zinc-500 font-mono ml-2">Step {step} of 4</span>
        </div>
      </header>

      {/* Main Step Cards */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Getting Started
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Name Your Voice Workspace</h1>
              <p className="text-zinc-400 text-sm mt-1.5">
                Workspaces isolate your assistants, phone numbers, and call logs from other environments.
              </p>
            </div>

            <div className="space-y-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Workspace Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="e.g. Acme Support Center"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!workspaceName.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Continue to AI Provider <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Cpu className="w-3.5 h-3.5" /> Intelligence Engine
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Choose Your Primary LLM Provider</h1>
              <p className="text-zinc-400 text-sm mt-1.5">
                Switch effortlessly between cloud and local inference at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini Card */}
              <div
                onClick={() => setSelectedProvider('google_gemini')}
                className={`p-5 rounded-2xl border cursor-pointer transition ${
                  selectedProvider === 'google_gemini'
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      G
                    </span>
                    <span className="font-semibold text-zinc-100">Google Gemini</span>
                  </div>
                  {selectedProvider === 'google_gemini' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-2.5">
                  Sub-350ms cloud latency, 1M context window, 0% laptop CPU/RAM consumption.
                </p>
              </div>

              {/* Local Ollama Card */}
              <div
                onClick={() => setSelectedProvider('ollama')}
                className={`p-5 rounded-2xl border cursor-pointer transition ${
                  selectedProvider === 'ollama'
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                      O
                    </span>
                    <span className="font-semibold text-zinc-100">Ollama (Local)</span>
                  </div>
                  {selectedProvider === 'ollama' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-2.5">
                  100% on-premise private sovereign execution. Runs on localhost:11434.
                </p>
              </div>
            </div>

            {selectedProvider === 'google_gemini' && (
              <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Google Gemini API Key (Optional now, can add in Settings)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-mono"
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                Continue to Voice <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Volume2 className="w-3.5 h-3.5" /> Neural Acoustics
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Select Default Neural Voice</h1>
              <p className="text-zinc-400 text-sm mt-1.5">
                Our platform includes ultra-natural Indic and English multilingual voice models.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'mr-IN-AarohiNeural', name: 'Aarohi (आरोही)', lang: 'Marathi / Indian English', gender: 'Female' },
                { id: 'mr-IN-ManoharNeural', name: 'Manohar (मनोहर)', lang: 'Marathi / Hindi', gender: 'Male' },
                { id: 'hi-IN-SwaraNeural', name: 'Swara (स्वरा)', lang: 'Hindi / English', gender: 'Female' },
                { id: 'hi-IN-MadhurNeural', name: 'Madhur (मधुर)', lang: 'Hindi / English', gender: 'Male' },
              ].map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                    selectedVoice === v.id
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Volume2 className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-zinc-100">{v.name}</div>
                      <div className="text-xs text-zinc-400">
                        {v.lang} • {v.gender}
                      </div>
                    </div>
                  </div>
                  {selectedVoice === v.id && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                Configure First Assistant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Bot className="w-3.5 h-3.5" /> First Agent
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Create Your First Voice Agent</h1>
              <p className="text-zinc-400 text-sm mt-1.5">
                We will initialize your assistant in Supabase with your chosen settings.
              </p>
            </div>

            <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="e.g. Sales Inbound Agent"
                />
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Selected Engine:</span>
                  <span className="font-semibold text-zinc-200">
                    {selectedProvider === 'google_gemini' ? 'Google Gemini 2.0 Flash' : 'Local Ollama Qwen 3.5'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Voice:</span>
                  <span className="font-semibold text-zinc-200">{selectedVoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Twilio Phone Integration:</span>
                  <span className="text-emerald-400 font-semibold">Available in Phone Numbers tab</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                disabled={isSubmitting || !agentName.trim()}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Assistant...' : 'Complete Setup & Launch Studio'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 pt-6">
        © 2026 BizoraVoice AI. Built for real-world enterprise voice infrastructure.
      </footer>
    </div>
  );
}
