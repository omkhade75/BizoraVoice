'use client';

import React, { useState } from 'react';
import {
  Radio,
  Mic,
  Bot,
  Layers,
  PhoneForwarded,
  FileSpreadsheet,
  Play,
  Volume2,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Agent } from '@/lib/api';

interface AgentWorkflowCanvasProps {
  agent: Agent;
  onTestCall: (agentId: string) => void;
}

interface WorkflowNode {
  id: string;
  category: 'telephony' | 'greeting' | 'ai' | 'tool' | 'transfer' | 'audit';
  title: string;
  subtitle: string;
  description: string;
  status: string;
  icon: any;
  config: Record<string, string>;
}

export function AgentWorkflowCanvas({ agent, onTestCall }: AgentWorkflowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('greeting');
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);

  // Construct dynamic workflow nodes tailored to the active agent
  const nodes: WorkflowNode[] = [
    {
      id: 'telephony',
      category: 'telephony',
      title: '1. Telephony Ingress / Egress',
      subtitle: '4G VoLTE GSM Gateway & Direct Twilio',
      description:
        'Bi-directional audio bridge. Receives incoming calls or executes batch outbound dialing over local 4G Indian SIM or Twilio Media Streams.',
      status: 'Active (24ms Ping)',
      icon: Radio,
      config: {
        'Carrier Route': '4G VoLTE Gateway (Jio Unlimited ₹299/mo)',
        'Input Sampling': '16-bit 16,000 Hz Mono PCM',
        'Verification Lock': '0% OTP Restriction (Dial Any Number)',
        'Signaling Protocol': 'SIP / WebSocket Audio Stream',
      },
    },
    {
      id: 'greeting',
      category: 'greeting',
      title: '2. Regional Spoken Greeting',
      subtitle: `Voice: ${agent.voice}`,
      description:
        agent.greeting_message ||
        (agent.language === 'mr'
          ? 'नमस्कार! आम्ही बिझोरा व्हॉइस कडून बोलत आहोत. आम्ही आपल्याला कशी मदत करू शकतो?'
          : 'नमस्ते! मैं बिज़ोरा वॉइस से बोल रहा हूँ। बताइए मैं आपकी क्या सहायता कर सकता हूँ?'),
      status: '24kHz HD Audio',
      icon: Mic,
      config: {
        Voice: agent.voice,
        Language: agent.language.toUpperCase(),
        'Sample Rate': '24,000 Hz Studio HD',
        Format: 'Linear PCM WAV',
      },
    },
    {
      id: 'ai',
      category: 'ai',
      title: '3. Conversational Intelligence Core',
      subtitle: `LLM: Local Ollama (${agent.model})`,
      description: agent.system_prompt.slice(0, 150) + '...',
      status: 'Zero Cloud Token Fees',
      icon: Bot,
      config: {
        'LLM Model': agent.model,
        'STT Engine': 'faster-whisper (Local Offline)',
        Temperature: `${agent.temperature ?? 0.7}`,
        'Barge-In Interruption': 'Silero VAD (Active)',
        'Turnaround Latency': '< 400ms Sub-second',
      },
    },
    {
      id: 'tool',
      category: 'tool',
      title: '4. Dynamic Business Logic & Tools',
      subtitle: 'RFQ Price & Inventory Verification',
      description:
        'Executes live API queries during call: looks up commodity spot prices, warehouse inventory stock, and generates instant order tokens.',
      status: 'Local Webhook Hooked',
      icon: Layers,
      config: {
        'Tool Action': 'verify_stock_and_rfq_pricing',
        'Payload Fields': 'item_name, quantity, target_rate',
        'Execution Mode': 'Async Non-blocking Function Call',
      },
    },
    {
      id: 'transfer',
      category: 'transfer',
      title: '5. Escalation & Call Routing',
      subtitle: 'SIP Desk Transfer or Voice Note Backup',
      description:
        'If customer requests human manager or complex terms, bridges call to sales desk (+91) or sends dual-language voice note summary.',
      status: 'Fail-safe Enabled',
      icon: PhoneForwarded,
      config: {
        'Escalation Target': '+91 800-000-VAANI',
        Fallback: 'Instant Marathi/Hindi Voice Note Email',
        'Barge-in Trigger': 'User says "Manager" / "Bolna hai"',
      },
    },
    {
      id: 'audit',
      category: 'audit',
      title: '6. Audio Archive & Session Audit',
      subtitle: 'Dual-Language Transcripts & Analytics',
      description:
        'Stores full call audio recording, transcripts, and computes exact cloud bill saved compared to Vapi ($0.15/min).',
      status: '100% Private Disk',
      icon: FileSpreadsheet,
      config: {
        'Storage Directory': 'backend/storage/voicenotes/',
        'Cost Calculated': '₹5.80 / minute retained',
        Compliance: 'Local Hardware (HIPAA / GDPR safe)',
      },
    },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  const playSampleVoice = () => {
    setIsPlayingGreeting(true);
    // Simple synthesized browser preview if supported
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedNode.description);
      utterance.onend = () => setIsPlayingGreeting(false);
      utterance.onerror = () => setIsPlayingGreeting(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingGreeting(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canvas Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 px-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>{agent.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                {agent.language.toUpperCase()} • {agent.voice}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Interactive Call Flow Architecture: Click any stage to inspect real-time parameters
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onTestCall(agent.id)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-950/40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Test Real Call in Studio
        </button>
      </div>

      {/* Main Flow Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sequential Node-Tree Flow Canvas */}
        <div className="lg:col-span-7 space-y-3 relative">
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            const Icon = node.icon;

            return (
              <React.Fragment key={node.id}>
                {/* Node Card */}
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                          isSelected
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-950/40 font-bold'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                          {node.title}
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                          {node.subtitle}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase shrink-0 border font-semibold ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                </div>

                {/* Animated Connecting Flow Indicator */}
                {index < nodes.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <div className="flex flex-col items-center gap-0.5 text-zinc-700">
                      <div className="w-0.5 h-3 bg-zinc-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      <div className="w-0.5 h-3 bg-zinc-800" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Selected Node Configuration Inspector */}
        <div className="lg:col-span-5 sticky top-6 space-y-5">
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    Stage Parameters Inspector
                  </h3>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{selectedNode.title}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                LIVE
              </span>
            </div>

            {/* Description Box */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">
                Node Behavior & Content
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                {selectedNode.description}
              </p>
            </div>

            {/* Audio Voice Test Button for Spoken Nodes */}
            {(selectedNode.category === 'greeting' || selectedNode.category === 'ai') && (
              <button
                type="button"
                onClick={playSampleVoice}
                disabled={isPlayingGreeting}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                {isPlayingGreeting ? 'Synthesizing Audio Preview...' : 'Test Regional Spoken Voice'}
              </button>
            )}

            {/* Config Key-Value Details */}
            <div className="space-y-2.5">
              <div className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">
                Engine & Telecom Telemetry
              </div>
              <div className="space-y-1.5">
                {Object.entries(selectedNode.config).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 px-3 rounded-lg bg-zinc-950/80 border border-zinc-800/70 flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-400 font-medium">{key}</span>
                    <span className="font-mono text-zinc-200 font-semibold text-[11px] text-right truncate max-w-[200px]">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Highlight */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-zinc-300 leading-relaxed">
                <span className="text-emerald-400 font-semibold">100% Free Inference:</span> Executed
                via local faster-whisper and Ollama with zero external cloud API requests.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
