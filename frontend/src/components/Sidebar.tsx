'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { getStoredUser, logoutUser, AuthUser } from '@/lib/api';
import {
  PhoneCall,
  Radio,
  Bot,
  Code2,
  History,
  Sparkles,
  Hash,
  LogIn,
  LogOut,
  Users,
  Wrench,
  BookOpen,
  BarChart3,
  Volume2,
  Settings2,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot?: () => void;
}

const NAV_GROUPS = [
  {
    title: 'Voice Products',
    items: [
      { href: '/agents', label: 'Assistants', icon: Bot, badge: 'Gemini+Ollama' },
      { href: '/numbers', label: 'Phone Numbers', icon: Hash, badge: 'Twilio+GSM' },
      { href: '/squads', label: 'Squads & Flows', icon: Users, badge: 'Multi-Agent' },
      { href: '/tools', label: 'Tools & Webhooks', icon: Wrench, badge: null },
      { href: '/knowledge', label: 'Knowledge Base', icon: BookOpen, badge: 'RAG' },
      { href: '/campaigns', label: 'Bulk Dialer', icon: Radio, badge: 'Automated' },
      { href: '/history', label: 'Call Logs', icon: History, badge: null },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: '380ms' },
      { href: '/voices', label: 'Voice Library', icon: Volume2, badge: '15+ Indic' },
      { href: '/call', label: 'Voice Studio', icon: PhoneCall, badge: 'Live' },
    ],
  },
  {
    title: 'Developers & Config',
    items: [
      { href: '/developers', label: 'API Keys & SDK', icon: Code2, badge: null },
      { href: '/settings', label: 'Settings & Supabase', icon: Settings2, badge: null },
    ],
  },
];

export function Sidebar({ onOpenCopilot }: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      setIsDark(stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }
  }, [pathname]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 shrink-0 justify-between select-none overflow-y-auto transition-colors">
        <div>
          {/* Brand Header */}
          <Link href="/" className="flex items-center px-2 mb-4 group cursor-pointer">
            <BrandLogo size="md" />
          </Link>

          {/* AI Helper Pill */}
          <button
            type="button"
            onClick={onOpenCopilot}
            className="w-full mb-4 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 hover:border-amber-500/50 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Need Help?</div>
                <div className="text-[10px] text-zinc-500">Ask Vaani Copilot</div>
              </div>
            </div>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/15">
              AI
            </span>
          </button>

          {/* Navigation Groups */}
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-1.5 tracking-wider">
                  {group.title}
                </div>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-zinc-800/90 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-zinc-700/80 font-bold shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
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
            ))}
          </div>
        </div>

        {/* User Account & Theme Controls */}
        <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-900">
          {/* Quick Theme Toggle & Health Indicator */}
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase 17.11 Active
            </span>
            <button
              onClick={toggleTheme}
              type="button"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
            </button>
          </div>

          {currentUser ? (
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {(currentUser.name || 'U')[0].toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 px-1 rounded bg-emerald-500/10">PRO</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">{currentUser.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-zinc-100 dark:via-zinc-900 to-zinc-100 dark:to-zinc-900 border border-emerald-500/25 hover:border-emerald-500/50 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Sign In / Register</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Continue with Google</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Free
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around py-2 px-1">
        {NAV_GROUPS[0].items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium rounded-lg transition ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
