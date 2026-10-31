'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Check, Copy, HelpCircle, ArrowRight } from 'lucide-react';
import { askCopilot } from '@/lib/api';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'How do I add a Marathi voice agent for suppliers?',
  'Show Python code to start a voice call using API key',
  'How does BizoraVoice save cost vs Vapi.ai?',
  'How to configure Twilio BYOT phone numbers?',
];

export function CopilotDrawer({ isOpen, onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 Welcome to **BizoraVoice Copilot**! I am your AI platform assistant. I can help you configure agents in regional Indian languages (Marathi, Hindi, Gujarati, English), generate API code, set up Twilio BYOT, and optimize your 329ms voice pipeline. How can I assist you today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || inputValue.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInputValue('');
    setLoading(true);

    try {
      const response = await askCopilot(query);
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.reply,
        codeSnippet: response.code_snippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error fetching response: ${err.message || 'Make sure backend is running on localhost:8000'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-obsidian-surface border-l border-border-subtle shadow-2xl flex flex-col backdrop-blur-md transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-obsidian-elevated/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              Bizora Voice Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                AI ASSIST
              </span>
            </h3>
            <p className="text-xs text-text-tertiary">Architecture & Telephony Guidance</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-obsidian-elevated transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 text-xs leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2.5 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-obsidian-canvas font-medium rounded-br-none'
                  : 'bg-obsidian-elevated border border-border-subtle text-text-primary rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.codeSnippet && (
                <div className="mt-2 rounded-lg bg-obsidian-canvas border border-border-subtle overflow-hidden text-[11px] font-mono">
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-obsidian-elevated border-b border-border-subtle text-text-secondary">
                    <span>Code Snippet</span>
                    <button
                      onClick={() => copyToClipboard(msg.codeSnippet!)}
                      className="flex items-center gap-1 hover:text-amber-500"
                    >
                      {copiedCode === msg.codeSnippet ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 text-text-secondary overflow-x-auto">{msg.codeSnippet}</pre>
                </div>
              )}

              <div
                className={`text-[10px] text-right font-mono ${
                  msg.role === 'user' ? 'text-obsidian-canvas/80' : 'text-text-tertiary'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 text-xs justify-start items-center text-text-secondary">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 p-3 rounded-xl bg-obsidian-elevated border border-border-subtle font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-300" />
              <span className="text-text-tertiary ml-1">Copilot reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 border-t border-border-subtle bg-obsidian-elevated/30">
        <div className="text-[11px] text-text-tertiary font-mono mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-amber-500" />
          Suggested queries:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-obsidian-elevated hover:bg-obsidian-hover text-text-secondary hover:text-text-primary border border-border-subtle transition flex items-center gap-1 text-left"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-2.5 h-2.5 text-text-tertiary" />
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border-subtle bg-obsidian-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about Marathi prompts, API keys, or pricing..."
            className="flex-1 bg-obsidian-elevated border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-semibold disabled:opacity-40 transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
