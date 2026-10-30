'use client';

import React, { useState } from 'react';
import {
  Mail,
  Send,
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  FileAudio,
  User,
  ShoppingBag,
  IndianRupee,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { sendSupplierVoiceNote, SupplierVoiceNoteResult, getAudioFileUrl } from '@/lib/api';

interface SentVoiceNoteRecord {
  id: string;
  supplier_name: string;
  supplier_email: string;
  item_name: string;
  language: string;
  audio_url: string;
  transcript_marathi: string;
  transcript_english: string;
  date: string;
}

const LANGUAGES = [
  { code: 'mr', name: 'मराठी (Marathi)', voice: 'mr-IN-AarohiNeural (24kHz HD)' },
  { code: 'hi', name: 'हिन्दी (Hindi)', voice: 'hi-IN-SwaraNeural (24kHz HD)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', voice: 'gu-IN-DhwaniNeural' },
  { code: 'en', name: 'English (Indian Accent)', voice: 'en-IN-NeerjaNeural' },
];

export default function SupplierOutreachPage() {
  const [supplierName, setSupplierName] = useState('Ramesh Patil');
  const [supplierEmail, setSupplierEmail] = useState('supplier.patil@example.com');
  const [itemName, setItemName] = useState('Grade-A Organic Soybean Seed');
  const [quantity, setQuantity] = useState('500 bags (50kg each)');
  const [targetPrice, setTargetPrice] = useState('₹3,200 per bag');
  const [language, setLanguage] = useState('mr');
  const [customMessage, setCustomMessage] = useState(
    'Please confirm stock availability and dispatch time to Pune warehouse.'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SupplierVoiceNoteResult | null>(null);
  const [history, setHistory] = useState<SentVoiceNoteRecord[]>([]);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleGenerateAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierEmail || !itemName || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await sendSupplierVoiceNote({
        supplier_name: supplierName,
        supplier_email: supplierEmail,
        item_name: itemName,
        quantity,
        target_price: targetPrice,
        language,
        custom_message: customMessage,
      });

      setResult(res);

      // Add to local history list
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          supplier_name: supplierName,
          supplier_email: supplierEmail,
          item_name: itemName,
          language,
          audio_url: res.audio_url,
          transcript_marathi: res.transcript_marathi,
          transcript_english: res.transcript_english,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Error generating voice note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
    } else if (audioRef.current.src !== url) {
      audioRef.current.src = url;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
            SUPPLIER AUTOMATION
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
            REGIONAL MARATHI TTS
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Mail className="w-6 h-6 text-amber-400" />
          Supplier Outreach & Multilingual Voice Notes
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Select regional Marathi or Hindi for the audio voice note. The system creates a studio-quality
          .wav recording, attaches it to the official RFQ email, and displays dual-language transcripts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Dispatch New Voice Note Email
          </h2>

          <form onSubmit={handleGenerateAndSend} className="space-y-4">
            {/* Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Select Audio Language for Supplier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 rounded-xl border text-left transition ${
                      language === lang.code
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 font-medium'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{lang.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{lang.voice}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-500" />
                  Supplier Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-zinc-500" />
                  Supplier Email
                </label>
                <input
                  type="email"
                  required
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="ramesh@patilagro.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Item & RFQ Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-zinc-500" />
                  Item / Commodity
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Soybean Seed"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Quantity</label>
                <input
                  type="text"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="500 bags"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-zinc-500" />
                  Target Price
                </label>
                <input
                  type="text"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="₹3,200/bag"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Special Instructions / Delivery Terms
              </label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Mention delivery timelines, payment terms, or inspection terms..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/40 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Regional Voice & Dispatching...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Generate Voice Note & Send to Supplier</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Audio & Transcript Preview Column */}
        <div className="lg:col-span-5 space-y-5">
          {result ? (
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Voice Note Successfully Generated!
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                  SENT
                </span>
              </div>

              {/* Audio Player Card */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileAudio className="w-4 h-4 text-amber-400" />
                    {result.audio_filename}
                  </span>
                  <span className="text-[10px] text-zinc-500">24kHz PCM WAV</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlayAudio(result.audio_url)}
                    className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-md shadow-emerald-950/40"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full bg-emerald-500 rounded-full transition-all duration-300 ${
                          isPlaying ? 'w-full animate-pulse' : 'w-0'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                      <span>{isPlaying ? 'Playing Marathi Voice Note' : 'Click to Play'}</span>
                      <span>0:14</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Transcripts */}
              <div className="space-y-3">
                {result.transcript_marathi && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Marathi Spoken Transcript (मराठी व्हॉईस नोट)
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                      "{result.transcript_marathi}"
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    English Meaning
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    "{result.transcript_english}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-amber-400 mx-auto flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">Audio Preview Waiting</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fill the RFQ enquiry on the left and click dispatch. Bizora Voice will synthesize the
                Marathi speech note and attach the .wav file directly.
              </p>
            </div>
          )}

          {/* Recent Outreaches Log */}
          {history.length > 0 && (
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Session Dispatches
              </h3>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">{h.supplier_name}</div>
                      <div className="text-[10px] text-zinc-500">{h.item_name}</div>
                    </div>
                    <button
                      onClick={() => togglePlayAudio(h.audio_url)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-mono text-[10px] flex items-center gap-1 transition"
                    >
                      <Play className="w-2.5 h-2.5" /> Replay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
