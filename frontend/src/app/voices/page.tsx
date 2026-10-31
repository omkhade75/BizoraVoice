'use client';

import React, { useState } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  Sparkles,
  Bot,
  Globe,
  Mic,
} from 'lucide-react';

interface VoiceItem {
  id: string;
  name: string;
  language: string;
  code: string;
  gender: 'Female' | 'Male';
  accent: string;
  type: string;
  sampleText: string;
}

const VOICE_CATALOG: VoiceItem[] = [
  // Marathi
  {
    id: 'mr-IN-AarohiNeural',
    name: 'Aarohi (आरोगी)',
    language: 'Marathi',
    code: 'mr',
    gender: 'Female',
    accent: 'Maharashtra, India',
    type: 'Neural',
    sampleText: 'नमस्कार! ताज रेसिडेंसी आणि कृषी उत्पन्न बाजार समितीत आपले मनापासून स्वागत आहे.',
  },
  {
    id: 'mr-IN-ManoharNeural',
    name: 'Manohar (मनोहर)',
    language: 'Marathi',
    code: 'mr',
    gender: 'Male',
    accent: 'Maharashtra, India',
    type: 'Neural',
    sampleText: 'नमस्कार शेतकरी बंधूंनो, आज नाशिक बाजार समितीत कांद्याला प्रति क्विंटल २,४५० रुपये भाव चालू आहे.',
  },
  // Hindi
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (स्वरा)',
    language: 'Hindi',
    code: 'hi',
    gender: 'Female',
    accent: 'Delhi / North India',
    type: 'Neural',
    sampleText: 'नमस्ते! मैं आपकी एआई वॉइस असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता कर सकती हूँ?',
  },
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (मधुर)',
    language: 'Hindi',
    code: 'hi',
    gender: 'Male',
    accent: 'North India',
    type: 'Neural',
    sampleText: 'शुभ प्रभात! डॉ. पाटिल डेंटल क्लिनिक में आपका स्वागत है। क्या आप अपॉइंटमेंट बुक करना चाहते हैं?',
  },
  // Gujarati
  {
    id: 'gu-IN-DhwaniNeural',
    name: 'Dhwani (ધ્વનિ)',
    language: 'Gujarati',
    code: 'gu',
    gender: 'Female',
    accent: 'Gujarat, India',
    type: 'Neural',
    sampleText: 'નમસ્તે! બિઝોરા વોઇસમાં આપનું સ્વાગત છે. હું તમારી સહાય માટે અહીં છું.',
  },
  {
    id: 'gu-IN-NiranjanNeural',
    name: 'Niranjan (નિરંજન)',
    language: 'Gujarati',
    code: 'gu',
    gender: 'Male',
    accent: 'Gujarat, India',
    type: 'Neural',
    sampleText: 'નમસ્તે વેપારી મિત્રો, આજના રાજકોટ માર્કેટ યાર્ડના કપાસના ભાવ માટે સંપર્ક કરો.',
  },
  // Tamil
  {
    id: 'ta-IN-PallaviNeural',
    name: 'Pallavi (பல்லவி)',
    language: 'Tamil',
    code: 'ta',
    gender: 'Female',
    accent: 'Tamil Nadu, India',
    type: 'Neural',
    sampleText: 'வணக்கம்! உங்கள் வாடிக்கையாளர் சேவைக்கு பல்லவி பேசுகிறேன்.',
  },
  {
    id: 'ta-IN-ValluvarNeural',
    name: 'Valluvar (வள்ளுவர்)',
    language: 'Tamil',
    code: 'ta',
    gender: 'Male',
    accent: 'Tamil Nadu, India',
    type: 'Neural',
    sampleText: 'வணக்கம்! இன்றைய வர்த்தக விலை நிலவரங்களை உடனடியாக அறியலாம்.',
  },
  // Indian English
  {
    id: 'en-IN-NeerjaNeural',
    name: 'Neerja (Executive English)',
    language: 'Indian English',
    code: 'en-IN',
    gender: 'Female',
    accent: 'India (Corporate Pan-India)',
    type: 'Neural',
    sampleText: 'Hello and welcome! Thank you for calling APMC Logistics. How may I direct your call today?',
  },
  {
    id: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Professional)',
    language: 'Indian English',
    code: 'en-IN',
    gender: 'Male',
    accent: 'India (Corporate Pan-India)',
    type: 'Neural',
    sampleText: 'Good afternoon. This is Prabhat from Bizora Voice customer intelligence desk.',
  },
  // Global Kokoro English
  {
    id: 'af_heart',
    name: 'Heart (Warm Global)',
    language: 'Global English',
    code: 'en-US',
    gender: 'Female',
    accent: 'American Soft',
    type: 'Neural',
    sampleText: 'Hello there! Welcome to the modern voice platform. Experience sub-400 millisecond conversational latency.',
  },
  {
    id: 'am_adam',
    name: 'Adam (Executive US)',
    language: 'Global English',
    code: 'en-US',
    gender: 'Male',
    accent: 'American Corporate',
    type: 'Neural',
    sampleText: 'Hi, this is Adam. Built for enterprise high-throughput outbound calling without any per-minute markups.',
  },
];

export default function VoicesPage() {
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const filteredVoices = VOICE_CATALOG.filter((v) => {
    if (selectedLang !== 'all' && v.language !== selectedLang) return false;
    if (selectedGender !== 'all' && v.gender !== selectedGender) return false;
    return true;
  });

  const handlePlayVoice = (voice: VoiceItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (playingVoiceId === voice.id) {
        setPlayingVoiceId(null);
        return;
      }
      setPlayingVoiceId(voice.id);
      const u = new SpeechSynthesisUtterance(voice.sampleText);
      u.rate = 0.95;
      u.onend = () => setPlayingVoiceId(null);
      u.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(u);
    } else {
      setPlayingVoiceId(voice.id);
      setTimeout(() => setPlayingVoiceId(null), 2500);
    }
  };

  const languages = ['all', 'Marathi', 'Hindi', 'Gujarati', 'Tamil', 'Indian English', 'Global English'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Voice Library & Acoustic Models
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Sub-70ms Synthesis
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Audition and assign ultra-realistic Indic and global neural voice actors with authentic regional intonation and accents.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase text-[10px] tracking-wider pl-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Language:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedLang === l
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-750'
              }`}
            >
              {l === 'all' ? 'All Languages' : l}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block mx-1" />

        {/* Gender Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Gender:</span>
          {(['all', 'Female', 'Male'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedGender === g
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => {
          const isPlaying = playingVoiceId === voice.id;
          return (
            <div
              key={voice.id}
              className={`p-5 rounded-2xl border transition-all ${
                isPlaying
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handlePlayVoice(voice)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-sm ${
                      isPlaying
                        ? 'bg-emerald-600 text-white scale-105'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{voice.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                      <span>{voice.language}</span>
                      <span>•</span>
                      <span>{voice.gender}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {voice.accent}
                </span>
              </div>

              {/* Sample Spoken Text */}
              <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 italic line-clamp-2">
                “{voice.sampleText}”
              </div>

              {/* Voice ID & Assign Pill */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-850 text-xs">
                <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[170px]">
                  {voice.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Sub-70ms Edge
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
