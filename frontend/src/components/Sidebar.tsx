'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PhoneCall,
  Bot,
  MailCheck,
  Code2,
  History,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot?: () => void;
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/call', label: 'Live Studio', icon: PhoneCall },
  { href: '/agents', label: 'Agent Studio', icon: Bot },
  { href: '/outreach', label: 'Voice Notes & Outreach', icon: MailCheck },
  { href: '/developers', label: 'Developer API & Keys', icon: Code2 },
  { href: '/history', label: 'Call Transcripts', icon: History },
];

export function Sidebar({ onOpenCopilot }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950 p-4 shrink-0 justify-between select-none">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
              BV
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-zinc-100 text-base tracking-tight">Bizora Voice</h1>
              </div>
              <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Self-Hosted Platform
              </p>
            </div>
          </div>

          {/* Copilot Quick Launch Banner */}
          <button
            type="button"
            onClick={onOpenCopilot}
            className="w-full mb-5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Bizora Copilot</div>
                <div className="text-[10px] text-zinc-400">Ask how to use & integrate</div>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10">
              AI
            </span>
          </button>

          {/* Navigation Links */}
          <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 mb-2 tracking-wider">
            Menu
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/60 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Hardware & Security Card */}
        <div className="space-y-3">
          <div className="p-3 bg-zinc-900/70 border border-zinc-800/80 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                Local Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-400">100% Free</span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-snug space-y-1">
              <div className="flex justify-between">
                <span>Speech STT:</span>
                <span className="text-zinc-300 font-mono">faster-whisper</span>
              </div>
              <div className="flex justify-between">
                <span>LLM:</span>
                <span className="text-zinc-300 font-mono">Ollama (qwen/deepseek)</span>
              </div>
              <div className="flex justify-between">
                <span>TTS Voices:</span>
                <span className="text-zinc-300 font-mono">Indic + Neural</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] text-zinc-500 font-mono">
            <span>v1.0.0-PROD</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-500" /> Vapi Killer
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium rounded-lg transition ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
