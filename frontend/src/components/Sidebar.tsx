'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PhoneCall,
  Radio,
  Bot,
  MailCheck,
  Code2,
  History,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Hash,
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot?: () => void;
}

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, badge: null },
  { href: '/call', label: 'Make a Voice Call', icon: PhoneCall, badge: 'Live' },
  { href: '/numbers', label: 'Phone Numbers & Twilio', icon: Hash, badge: 'Twilio+GSM' },
  { href: '/campaigns', label: 'Bulk Phone Dialer', icon: Radio, badge: 'Automated' },
  { href: '/agents', label: 'Voice Receptionists', icon: Bot, badge: '4 Active' },
  { href: '/outreach', label: 'Voice Notes & WhatsApp', icon: MailCheck, badge: null },
  { href: '/history', label: 'Call Recordings & Logs', icon: History, badge: null },
  { href: '/developers', label: 'API & Integrations', icon: Code2, badge: null },
];

export function Sidebar({ onOpenCopilot }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950 p-4 shrink-0 justify-between select-none">
        <div>
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 px-2 mb-6 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-zinc-950 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-950/50 border border-emerald-400/40 group-hover:scale-105 transition-transform">
              BV
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-100 text-base tracking-tight">Bizora Voice</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Indian AI Telephony
              </p>
            </div>
          </Link>

          {/* AI Helper Pill */}
          <button
            type="button"
            onClick={onOpenCopilot}
            className="w-full mb-6 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 hover:border-amber-500/50 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-100">Need Help?</div>
                <div className="text-[10px] text-zinc-400">Ask Bizora AI Assistant</div>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/15">
              AI
            </span>
          </button>

          {/* Navigation Links */}
          <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 mb-2 tracking-wider">
            Main Menu
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 text-emerald-400 border border-zinc-700/80 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Status Box */}
        <div className="space-y-2 pt-4 border-t border-zinc-900">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-200 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero Cloud Markup
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Free
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Runs 100% on local infrastructure. Never pay \$0.07/min Vapi cloud bills.
            </p>
          </div>

          <div className="flex items-center justify-between px-2 text-[10px] text-zinc-500">
            <span>Marathi • Hindi • Gujarati</span>
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.slice(0, 5).map((item) => {
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
              <span className="truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
