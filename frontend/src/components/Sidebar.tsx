'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { getStoredUser, logoutUser, AuthUser } from '@/lib/api';
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
  LogIn,
  LogOut,
  User as UserIcon,
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950 p-4 shrink-0 justify-between select-none overflow-y-auto">
        <div>
          {/* Brand Header with Precision Vector Logo */}
          <Link href="/" className="flex items-center px-2 mb-6 group cursor-pointer">
            <BrandLogo size="md" />
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
                <div className="text-[10px] text-zinc-400">Ask Vaani AI Assistant</div>
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

        {/* User Account / Sign In Widget */}
        <div className="space-y-2 pt-3 border-t border-zinc-900">
          {currentUser ? (
            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (currentUser.name || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[9px] font-mono text-emerald-400 px-1 rounded bg-emerald-500/10">PRO</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">{currentUser.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/25 hover:border-emerald-500/50 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-zinc-200">Sign In / Register</div>
                  <div className="text-[10px] text-zinc-400">Continue with Google</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Free
              </span>
            </Link>
          )}

          {/* Footer Status Box */}
          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero Cloud Markup
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                100% Free
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Runs 100% on self-hosted stack. Zero Vapi platform fees.
            </p>
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
