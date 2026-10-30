'use client';

import React, { useState, useEffect } from 'react';
import { Agent, CreateAgentPayload } from '@/lib/api';
import { X, Sparkles, MessageSquare } from 'lucide-react';

interface AgentFormProps {
  initialData?: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAgentPayload) => Promise<void>;
}

const VOICES = [
  { id: 'mr-IN-AarohiNeural', label: 'मराठी: Aarohi (Female HD)', lang: 'mr' },
  { id: 'mr-IN-ManoharNeural', label: 'मराठी: Manohar (Male HD)', lang: 'mr' },
  { id: 'hi-IN-SwaraNeural', label: 'हिन्दी: Swara (Female HD)', lang: 'hi' },
  { id: 'hi-IN-MadhurNeural', label: 'हिन्दी: Madhur (Male HD)', lang: 'hi' },
  { id: 'gu-IN-DhwaniNeural', label: 'ગુજરાતી: Dhwani (Female)', lang: 'gu' },
  { id: 'ta-IN-PallaviNeural', label: 'தமிழ்: Pallavi (Female)', lang: 'ta' },
  { id: 'en-IN-NeerjaNeural', label: 'English (India): Neerja', lang: 'en' },
  { id: 'af_heart', label: 'English (US): Heart (Warm)', lang: 'en' },
];

export function AgentForm({ initialData, isOpen, onClose, onSubmit }: AgentFormProps) {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [language, setLanguage] = useState('mr');
  const [voice, setVoice] = useState('mr-IN-AarohiNeural');
  const [model, setModel] = useState('qwen3.5:4b');
  const [temperature, setTemperature] = useState(0.4);
  const [maxDuration, setMaxDuration] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSystemPrompt(initialData.system_prompt);
      setGreetingMessage(initialData.greeting_message || '');
      setLanguage(initialData.language || 'mr');
      setVoice(initialData.voice);
      setModel(initialData.model);
      setTemperature(initialData.temperature ?? 0.4);
      setMaxDuration(initialData.max_duration_seconds ?? 600);
    } else {
      setName('');
      setSystemPrompt(
        'तुम्ही बिझोरा व्हॉईसचे कृत्रिम बुद्धिमत्ता (AI) सहाय्यक आहात. ग्राहकांशी आणि पुरवठादारांशी मराठीत नम्रतेने आणि अचूक बोला.'
      );
      setGreetingMessage('नमस्कार! मी बिझोरा व्हॉईस सहाय्यक आहे. मी आज आपली काय मदत करू शकतो?');
      setLanguage('mr');
      setVoice('mr-IN-AarohiNeural');
      setModel('qwen3.5:4b');
      setTemperature(0.4);
      setMaxDuration(600);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const matchedVoice = VOICES.find((v) => v.lang === newLang);
    if (matchedVoice) {
      setVoice(matchedVoice.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        system_prompt: systemPrompt,
        greeting_message: greetingMessage,
        language,
        voice,
        model,
        temperature,
        max_duration_seconds: maxDuration,
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to save agent: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-zinc-950 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-800 text-zinc-100">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {initialData ? 'Edit AI Voice Agent' : 'Create New Voice Agent'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Configure regional language persona and local Ollama model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Agent Name & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Agent Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marathi Supplier Desk"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Language</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="mr">मराठी (Marathi)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English (Indian/US)</option>
              </select>
            </div>
          </div>

          {/* Voice & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Voice Profile</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Local Model</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="qwen3.5:4b"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Greeting Message */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              Initial Greeting Message (Spoken right on call connect)
            </label>
            <input
              type="text"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="e.g. नमस्कार! मी बिझोरा व्हॉईस सहाय्यक आहे..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* System Instructions */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              System Instructions (Prompt)
            </label>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define rules, tone, and goals for the conversation..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Sliders: Temperature & Max Duration */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Creativity (Temp):</span>
                <span className="font-mono text-emerald-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Max Call Limit:</span>
                <span className="font-mono text-zinc-200">{Math.round(maxDuration / 60)} min</span>
              </div>
              <input
                type="range"
                min="60"
                max="1800"
                step="60"
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-50 shadow-md shadow-emerald-950/40"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
