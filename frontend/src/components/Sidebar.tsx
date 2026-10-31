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
  CheckCircle2,
  Layers,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot?: () => void;
}

const NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { href: '/agents', label: 'Assistants', icon: Bot, badge: 'Gemini+Ollama' },
      { href: '/squads', label: 'Squads & Teams', icon: Users, badge: 'Swarm' },
    ],
  },
  {
    title: 'Telephony',
    items: [
      { href: '/numbers', label: 'Phone Numbers', icon: Hash, badge: 'Twilio BYOT' },
      { href: '/campaigns', label: 'Outbound Campaigns', icon: Radio, badge: 'Bulk' },
      { href: '/history', label: 'Call History', icon: History, badge: null },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { href: '/voices', label: 'Voice Library', icon: Volume2, badge: 'Neural' },
      { href: '/tools', label: 'Tools & Functions', icon: Wrench, badge: 'Webhooks' },
      { href: '/knowledge', label: 'Knowledge Base', icon: BookOpen, badge: 'RAG' },
    ],
  },
  {
    title: 'Testing & QA',
    items: [
      { href: '/call', label: 'Voice Playground', icon: PhoneCall, badge: 'Live 3D' },
      { href: '/evaluations', label: 'Evaluations & QA', icon: CheckCircle2, badge: 'Scorecard' },
      { href: '/developers', label: 'API Keys & Docs', icon: Code2, badge: null },
    ],
  },
  {
    title: 'Observability & Settings',
    items: [
      { href: '/analytics', label: 'Analytics & Latency', icon: BarChart3, badge: 'Realtime' },
      { href: '/settings', label: 'Settings & Providers', icon: Settings2, badge: null },
    ],
  },
];

export function Sidebar({ onOpenCopilot }: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (!stored && prefersDark) || stored === null;
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
      {/* Desktop Sidebar (Obsidian Studio Surface) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border-subtle bg-obsidian-surface dark:bg-[#141612] p-3.5 shrink-0 justify-between select-none overflow-y-auto transition-colors z-30">
        <div>
          {/* Brand Header & Workspace Switcher */}
          <div className="px-1.5 pb-3 mb-2 border-b border-border-subtle">
            <Link href="/" className="flex items-center group cursor-pointer mb-2.5">
              <BrandLogo size="md" />
            </Link>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-obsidian-elevated dark:bg-[#191B17] border border-border-subtle text-xs text-text-secondary">
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-medium text-text-primary truncate">Production Workspace</span>
              </div>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-border-subtle text-text-tertiary">
                v2.4
              </span>
            </div>
          </div>

          {/* AI Copilot Quick Launcher */}
          <button
            type="button"
            onClick={onOpenCopilot}
            className="w-full mb-3 p-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">Voice Copilot</div>
                <div className="text-[10px] text-text-tertiary">Architecture & Assist</div>
              </div>
            </div>
            <span className="text-[9px] text-amber-500 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15">
              ASK
            </span>
          </button>

          {/* Navigation Groups */}
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] uppercase font-mono font-semibold text-text-tertiary px-2 mb-1 tracking-wider">
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
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-obsidian-elevated dark:bg-[#191B17] text-text-primary border border-border-medium shadow-xs font-semibold'
                            : 'text-text-secondary hover:bg-obsidian-elevated/60 hover:text-text-primary'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-amber-500" />
                        )}
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive ? 'text-amber-500' : 'text-text-tertiary group-hover:text-text-secondary'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-amber-500/15 text-amber-400 font-medium'
                                : 'bg-border-subtle text-text-tertiary'
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

        {/* Telemetry Health & User Profile */}
        <div className="space-y-2 pt-3 border-t border-border-subtle mt-4">
          {/* Telemetry status & theme switch */}
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>329ms | Supabase OK</span>
            </span>
            <button
              onClick={toggleTheme}
              type="button"
              title={isDark ? 'Switch to Warm Ivory Light Mode' : 'Switch to Sonic Obsidian Dark Mode'}
              className="p-1.5 rounded-lg border border-border-subtle bg-obsidian-elevated text-text-secondary hover:text-text-primary hover:border-border-medium transition"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
            </button>
          </div>

          {currentUser ? (
            <div className="p-2 rounded-xl bg-obsidian-elevated dark:bg-[#191B17] border border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 font-bold text-xs flex items-center justify-center shrink-0">
                  {(currentUser.name || 'U')[0].toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-semibold text-text-primary truncate flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[9px] font-mono text-amber-400 px-1 rounded bg-amber-500/10">PRO</span>
                  </div>
                  <div className="text-[10px] text-text-tertiary truncate">{currentUser.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full p-2 rounded-xl bg-obsidian-elevated hover:bg-obsidian-hover border border-border-subtle hover:border-amber-500/30 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-text-primary">Sign In</div>
                  <div className="text-[10px] text-text-tertiary">Supabase Auth</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-amber-500 transition-colors" />
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-obsidian-surface/95 backdrop-blur-md border-b border-border-subtle px-4 py-2.5 flex items-center justify-between">
        <Link href="/">
          <BrandLogo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-1.5 rounded-lg border border-border-subtle bg-obsidian-elevated text-text-secondary"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-border-subtle bg-obsidian-elevated text-text-primary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Full Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[49px] z-50 bg-obsidian-surface overflow-y-auto p-4 space-y-4">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCopilot?.();
            }}
            className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-text-primary">Open Voice Copilot</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">AI</span>
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="text-[10px] uppercase font-mono font-semibold text-text-tertiary px-1">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-obsidian-elevated text-amber-400 border border-amber-500/30 font-semibold'
                        : 'text-text-secondary hover:bg-obsidian-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-border-subtle text-text-tertiary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pt-4 border-t border-border-subtle">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-primary">{currentUser.name}</div>
                  <div className="text-[10px] text-text-tertiary">{currentUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 rounded-lg bg-amber-500 text-obsidian-canvas font-semibold text-xs"
              >
                Sign In to Studio
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
