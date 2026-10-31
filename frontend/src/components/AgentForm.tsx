'use client';

import React, { useState, useEffect } from 'react';
import { Agent, CreateAgentPayload } from '@/lib/api';
import { X, Sparkles, MessageSquare, Zap, Cpu, Cloud } from 'lucide-react';

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

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', latency: 'Sub-300ms', desc: 'Fastest inference, 0% laptop load' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', latency: 'Sub-400ms', desc: 'High accuracy, balanced' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', latency: 'Sub-350ms', desc: 'Next-generation reasoning' },
];

const OLLAMA_MODELS = [
  { id: 'qwen3.5:4b', name: 'Qwen 3.5 (4B)', latency: 'Local', desc: 'Optimized for Marathi & Hindi' },
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', latency: 'Local', desc: 'Broader reasoning' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', latency: 'Local', desc: 'Lightweight local model' },
  { id: 'mistral:7b', name: 'Mistral (7B)', latency: 'Local', desc: 'Standard local instruction' },
];

export function AgentForm({ initialData, isOpen, onClose, onSubmit }: AgentFormProps) {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [language, setLanguage] = useState('mr');
  const [voice, setVoice] = useState('mr-IN-AarohiNeural');

  // LLM Provider: 'gemini' (Cloud) or 'ollama' (Local)
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');

  const [temperature, setTemperature] = useState(0.7);
  const [maxDuration, setMaxDuration] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSystemPrompt(initialData.system_prompt);
      setGreetingMessage(initialData.greeting_message || '');
      setLanguage(initialData.language || 'mr');
      setVoice(initialData.voice);

      const isGemini = initialData.model.toLowerCase().startsWith('gemini');
      setLlmProvider(isGemini ? 'gemini' : 'ollama');
      setModel(initialData.model);

      setTemperature(initialData.temperature ?? 0.7);
      setMaxDuration(initialData.max_duration_seconds ?? 600);
    } else {
      setName('');
      setSystemPrompt(
        'तुम्ही बिझोरा व्हॉईसचे कृत्रिम बुद्धिमत्ता (AI) सहाय्यक आहात. ग्राहकांशी आणि पुरवठादारांशी मराठीत नम्रतेने आणि अचूक बोला.'
      );
      setGreetingMessage('नमस्कार! मी बिझोरा व्हॉईस सहाय्यक आहे. मी आज आपली काय मदत करू शकतो?');
      setLanguage('mr');
      setVoice('mr-IN-AarohiNeural');
      setLlmProvider('gemini');
      setModel('gemini-2.5-flash');
      setTemperature(0.7);
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

  const handleProviderChange = (provider: 'gemini' | 'ollama') => {
    setLlmProvider(provider);
    if (provider === 'gemini') {
      setModel('gemini-2.5-flash');
    } else {
      setModel('qwen3.5:4b');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {initialData ? 'Edit AI Voice Assistant' : 'Create New AI Voice Assistant'}
              </h2>
              <p className="text-[11px] text-zinc-500">
                Configure regional language, cloud Gemini / local Ollama model, and voice persona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Agent Name & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marathi Supplier Desk"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="mr">मराठी (Marathi)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English (Indian/US)</option>
              </select>
            </div>
          </div>

          {/* Voice Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Voice Actor Profile
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── PARALLEL LLM SELECTION: GEMINI CLOUD VS OLLAMA LOCAL ── */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>LLM Engine Architecture</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {llmProvider === 'gemini' ? '0% Laptop CPU/GPU' : 'Sovereign On-Prem'}
              </span>
            </div>

            {/* Provider Switch Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  llmProvider === 'gemini'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs ring-1 ring-blue-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">Google Gemini</div>
                  <div className="text-[9px] text-zinc-500">Cloud (0% load on laptop)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('ollama')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  llmProvider === 'ollama'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">Local Ollama</div>
                  <div className="text-[9px] text-zinc-500">Laptop Hardware / Offline</div>
                </div>
              </button>
            </div>

            {/* Model Dropdown based on active provider */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Selected Model:
              </label>
              {llmProvider === 'gemini' ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-blue-300 dark:border-blue-800/80 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GEMINI_MODELS.map((gm) => (
                    <option key={gm.id} value={gm.id}>
                      {gm.name} — {gm.latency} ({gm.desc})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {OLLAMA_MODELS.map((om) => (
                      <option key={om.id} value={om.id}>
                        {om.name} — ({om.desc})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="or enter custom Ollama model name"
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Initial Greeting Message */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Initial Greeting Message (Spoken instantly on call connect)</span>
            </label>
            <input
              type="text"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="e.g. नमस्कार! मी बिझोरा व्हॉईस सहाय्यक आहे..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* System Instructions */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              System Instructions (Persona & Knowledge Prompt)
            </label>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are Bizora Voice assistant..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Temperature & Max Duration Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1 font-semibold">
                <span>Creativity (Temp): {temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1 font-semibold">
                <span>Max Call: {Math.round(maxDuration / 60)} mins</span>
              </div>
              <input
                type="range"
                min="60"
                max="1800"
                step="60"
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? 'Saving Assistant...' : initialData ? 'Update Assistant' : 'Create Assistant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
