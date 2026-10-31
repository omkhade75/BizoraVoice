'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Filter,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

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
    type: 'Neural HD',
    sampleText: 'नमस्कार! ताज रेसिडेंसी आणि कृषी उत्पन्न बाजार समितीत आपले मनापासून स्वागत आहे.',
  },
  {
    id: 'mr-IN-ManoharNeural',
    name: 'Manohar (मनोहर)',
    language: 'Marathi',
    code: 'mr',
    gender: 'Male',
    accent: 'Maharashtra, India',
    type: 'Neural HD',
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
    type: 'Neural HD',
    sampleText: 'नमस्ते! मैं आपकी एआई वॉइस असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता कर सकती हूँ?',
  },
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (मधुर)',
    language: 'Hindi',
    code: 'hi',
    gender: 'Male',
    accent: 'North India',
    type: 'Neural HD',
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
    type: 'Neural HD',
    sampleText: 'નમસ્તે! બિઝોરા વોઇસમાં આપનું સ્વાગત છે. હું તમારી સહાય માટે અહીં છું.',
  },
  {
    id: 'gu-IN-NiranjanNeural',
    name: 'Niranjan (નિરંજન)',
    language: 'Gujarati',
    code: 'gu',
    gender: 'Male',
    accent: 'Gujarat, India',
    type: 'Neural HD',
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
    type: 'Neural HD',
    sampleText: 'வணக்கம்! உங்கள் வாடிக்கையாளர் சேவைக்கு பல்லவி பேசுகிறேன்.',
  },
  {
    id: 'ta-IN-ValluvarNeural',
    name: 'Valluvar (வள்ளுவர்)',
    language: 'Tamil',
    code: 'ta',
    gender: 'Male',
    accent: 'Tamil Nadu, India',
    type: 'Neural HD',
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
    type: 'Neural HD',
    sampleText: 'Hello and welcome! Thank you for calling APMC Logistics. How may I direct your call today?',
  },
  {
    id: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Professional)',
    language: 'Indian English',
    code: 'en-IN',
    gender: 'Male',
    accent: 'India (Corporate Pan-India)',
    type: 'Neural HD',
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
    type: 'Neural HD',
    sampleText: 'Hello there! Welcome to BizoraVoice. Experience sub-329 millisecond conversational latency.',
  },
  {
    id: 'am_adam',
    name: 'Adam (Executive US)',
    language: 'Global English',
    code: 'en-US',
    gender: 'Male',
    accent: 'American Corporate',
    type: 'Neural HD',
    sampleText: 'Hi, this is Adam. Built for enterprise high-throughput outbound calling without any per-minute markups.',
  },
];

export default function VoicesPage() {
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const filteredVoices = VOICE_CATALOG.filter((v) => {
    if (selectedLang !== 'all' && v.language !== selectedLang) return false;
    if (selectedGender !== 'all' && v.gender !== selectedGender) return false;
    return true;
  });

  const handlePlayVoice = async (voice: VoiceItem) => {
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    try {
      setPlayingVoiceId(voice.id);
      const res = await fetch(`${API_BASE}/api/voices/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voice.id, text: voice.sampleText }),
      });
      if (!res.ok) throw new Error('Preview synthesis failed');
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      // Browser Web Speech API fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(voice.sampleText);
        u.rate = 0.95;
        u.onend = () => setPlayingVoiceId(null);
        u.onerror = () => setPlayingVoiceId(null);
        window.speechSynthesis.speak(u);
      } else {
        setPlayingVoiceId(null);
      }
    }
  };

  const languages = ['all', 'Marathi', 'Hindi', 'Gujarati', 'Tamil', 'Indian English', 'Global English'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              <Volume2 className="w-6 h-6 text-amber-500" />
              Voice Library & Acoustic Models
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Sub-70ms Edge Synthesis
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Audition and assign ultra-realistic Indic and global neural voice actors with authentic regional intonation and accents.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs text-xs">
        <div className="flex items-center gap-1.5 text-text-tertiary font-mono font-bold uppercase text-[10px] tracking-wider pl-1">
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
                  ? 'bg-amber-500 text-obsidian-canvas shadow-xs font-bold'
                  : 'bg-obsidian-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              {l === 'all' ? 'All Languages' : l}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border-subtle hidden md:block mx-1" />

        {/* Gender Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          {['all', 'Female', 'Male'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                selectedGender === g
                  ? 'bg-obsidian-elevated text-amber-500 border border-border-subtle font-bold'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              {g === 'all' ? 'All Genders' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => {
          const isPlaying = playingVoiceId === voice.id;
          return (
            <div
              key={voice.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isPlaying
                  ? 'bg-obsidian-elevated border-amber-500/60 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-obsidian-surface border-border-subtle hover:border-border-medium'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">{voice.name}</h3>
                    <div className="text-xs text-text-tertiary mt-0.5">{voice.accent}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-obsidian-canvas text-amber-500 border border-border-subtle">
                    {voice.gender}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-obsidian-canvas border border-border-subtle text-xs text-text-secondary italic line-clamp-3">
                  "{voice.sampleText}"
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {voice.type}
                </span>

                <button
                  type="button"
                  onClick={() => handlePlayVoice(voice)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    isPlaying
                      ? 'bg-emerald-500 text-obsidian-canvas'
                      : 'bg-amber-500 hover:bg-amber-400 text-obsidian-canvas shadow-xs'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
