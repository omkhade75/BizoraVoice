'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCall } from '@/hooks/useCall';
import { VoiceCore3D, VoiceCoreState } from './VoiceCore3D';
import { Transcript } from './Transcript';
import { StatusBadge } from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { Agent, getAgents, Squad, SquadMember, getSquads } from '@/lib/api';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
  Users,
  GitFork,
  PhoneForwarded,
  Radio,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Bot,
  Cloud,
  Cpu,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

export function CallPanel() {
  const searchParams = useSearchParams();
  const queryAgentId = searchParams?.get('agent') || searchParams?.get('agent_id');
  const querySquadId = searchParams?.get('squad') || searchParams?.get('squad_id');

  // Squad Multi-Agent Simulation state
  const [activeSquad, setActiveSquad] = useState<Squad | null>(null);
  const [currentMemberIdx, setCurrentMemberIdx] = useState<number>(0);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferBanner, setTransferBanner] = useState<string | null>(null);

  const {
    isInCall,
    callState,
    isMuted,
    userLevel,
    assistantLevel,
    transcript,
    duration,
    error,
    startCall,
    endCall,
    toggleMute,
    transferAgent,
  } = useCall({
    onAgentTransferred: (data) => {
      console.log('Server executed autonomous squad transfer:', data);
      if (typeof data.agent_idx === 'number') {
        setCurrentMemberIdx(data.agent_idx);
        setTransferBanner(`Transferred to ${data.agent_name || 'Specialist'}`);
        setTimeout(() => setTransferBanner(null), 4000);
      }
    },
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // AI Inference Engine Mode: 'gemini' (Cloud) vs 'ollama' (Local / Sovereign)
  const [inferenceMode, setInferenceMode] = useState<'gemini' | 'ollama'>('gemini');

  // Load preferences, agents and check for squad parameter
  useEffect(() => {
    // 0. Load cached inference preference
    if (typeof window !== 'undefined') {
      const savedMode = (localStorage.getItem('bizora_inference_mode') as 'gemini' | 'ollama') || 'gemini';
      setInferenceMode(savedMode);
    }

    // 1. Load Agents
    getAgents()
      .then((data) => {
        setAgents(data);
        if (data.length > 0) {
          if (queryAgentId && data.some((a) => a.id === queryAgentId || a.name.toLowerCase() === queryAgentId.toLowerCase())) {
            const matched = data.find((a) => a.id === queryAgentId || a.name.toLowerCase() === queryAgentId.toLowerCase());
            setSelectedAgentId(matched ? matched.id : data[0].id);
          } else {
            const marathiAgent = data.find((a) => a.language === 'mr');
            setSelectedAgentId(marathiAgent ? marathiAgent.id : data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load agents:', err));

    // 2. Load Squad if query parameter present
    if (querySquadId) {
      getSquads()
        .then((squads) => {
          const matched = squads.find(
            (s) => s.id === querySquadId || s.name.toLowerCase().includes(querySquadId.toLowerCase())
          );
          if (matched) {
            setActiveSquad(matched);
            setCurrentMemberIdx(0);
          }
        })
        .catch((err) => console.error('Failed to load squads:', err));
    }
  }, [queryAgentId, querySquadId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const activeMember: SquadMember | undefined = activeSquad?.members[currentMemberIdx];
  const nextMember: SquadMember | undefined = activeSquad?.members[currentMemberIdx + 1];

  const handleSelectEngine = (mode: 'gemini' | 'ollama') => {
    setInferenceMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bizora_inference_mode', mode);
    }
  };

  const handleStartCall = () => {
    const effectiveModel = inferenceMode === 'gemini' ? 'gemini-2.0-flash' : 'qwen3.5:4b';

    if (activeSquad && activeMember) {
      // Start call with Squad Lead Agent
      const lang = activeMember.language.toLowerCase().includes('marathi')
        ? 'mr'
        : activeMember.language.toLowerCase().includes('hindi')
        ? 'hi'
        : 'en';
      startCall(
        undefined,
        lang,
        activeMember.systemPrompt,
        activeMember.voice,
        activeMember.greetingMessage,
        effectiveModel,
        inferenceMode,
        activeSquad.id,
        activeSquad.members
      );
    } else {
      // Standard Single Agent Call
      startCall(
        selectedAgentId || undefined,
        selectedAgent?.language,
        selectedAgent?.system_prompt,
        selectedAgent?.voice,
        selectedAgent?.greeting_message,
        effectiveModel,
        inferenceMode
      );
    }
  };

  const handleWarmTransfer = (targetIdx: number) => {
    if (!activeSquad || targetIdx < 0 || targetIdx >= activeSquad.members.length || targetIdx === currentMemberIdx) {
      return;
    }
    const current = activeSquad.members[currentMemberIdx];
    const target = activeSquad.members[targetIdx];

    setTransferring(true);
    setCurrentMemberIdx(targetIdx);

    const cue = current.transferPhrase || `Connecting you directly with ${target.name}.`;
    transferAgent(target.name, target.voice, target.systemPrompt, cue, targetIdx);

    setTransferBanner(`Transferred to ${target.name}`);
    setTimeout(() => {
      setTransferring(false);
      setTransferBanner(null);
    }, 2500);
  };

  // Map callState to VoiceCoreState
  const mapVoiceCoreState = (): VoiceCoreState => {
    if (!isInCall) return 'idle';
    if (callState === 'thinking') return 'processing';
    if (callState === 'speaking') return 'speaking';
    if (callState === 'listening') return 'listening';
    return 'listening';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* ── SQUAD SIMULATION ORCHESTRATION BANNER ─────────────────────────── */}
      {activeSquad && (
        <div className="bg-obsidian-surface rounded-2xl border border-amber-500/30 p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-96 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Squad Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    Multi-Agent Squad Simulation
                  </span>
                  <span className="text-xs text-text-tertiary hidden sm:inline">•</span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1">
                    <GitFork className="w-3 h-3 text-emerald-400" />
                    {activeSquad.handoffPolicy}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary mt-0.5">{activeSquad.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/squads"
                className="text-xs text-text-secondary hover:text-text-primary py-1.5 px-3 rounded-lg border border-border-subtle hover:bg-obsidian-elevated transition"
              >
                Back to Squads
              </Link>
              <button
                type="button"
                onClick={() => setActiveSquad(null)}
                className="text-xs text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
              >
                Exit Squad Mode
              </button>
            </div>
          </div>

          {/* Squad Multi-Agent Pipeline Steps */}
          <div>
            <div className="text-[11px] font-mono font-semibold text-text-tertiary uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Swarm Transfer Chain (Interactive Handoff)</span>
              {isInCall && (
                <span className="text-amber-400 normal-case font-sans text-xs">
                  Click any agent to warm-transfer live call
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeSquad.members.map((member, idx) => {
                const isActive = idx === currentMemberIdx;
                const isCompleted = idx < currentMemberIdx;

                return (
                  <div
                    key={member.id}
                    onClick={() => (isInCall && !isActive ? handleWarmTransfer(idx) : null)}
                    className={`p-3.5 rounded-xl border text-left transition relative ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                        : isCompleted
                        ? 'bg-obsidian-elevated/50 border-emerald-500/25 opacity-90'
                        : 'bg-obsidian-surface border-border-subtle opacity-75'
                    } ${isInCall && !isActive ? 'cursor-pointer hover:border-amber-500/40 hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-obsidian-canvas border border-border-subtle text-text-tertiary">
                        AGENT {idx + 1}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                          <Radio className="w-2.5 h-2.5" />
                          ACTIVE SPEAKER
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          HANDED OFF
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-text-tertiary">STANDBY</span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-text-primary">{member.name}</div>
                    <div className="text-[11px] text-text-secondary mt-0.5 truncate">{member.role}</div>

                    <div className="mt-2.5 pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-tertiary">{member.language}</span>
                      <span className="text-amber-500">{member.voice.split('-')[2] || member.voice}</span>
                    </div>

                    {/* Handoff cue tooltip */}
                    {member.transferPhrase && (
                      <div className="mt-2 text-[10px] text-text-tertiary italic line-clamp-1">
                        &quot;{member.transferPhrase}&quot;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CALL STAGE & TRANSCRIPT ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Call Stage */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* ── INFERENCE ENGINE & LAPTOP HARDWARE LOAD CONTROLLER ───────────── */}
          <div className="p-3.5 rounded-2xl bg-obsidian-surface border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-tertiary">
                Inference:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-obsidian-elevated border border-border-subtle gap-1">
                <button
                  type="button"
                  disabled={isInCall}
                  onClick={() => handleSelectEngine('gemini')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    inferenceMode === 'gemini'
                      ? 'bg-amber-500 text-obsidian-canvas font-bold shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  } disabled:opacity-50`}
                  title="Cloud Gemini: Ultra-low latency cloud AI"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Gemini</span>
                </button>

                <button
                  type="button"
                  disabled={isInCall}
                  onClick={() => handleSelectEngine('ollama')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    inferenceMode === 'ollama'
                      ? 'bg-amber-500 text-obsidian-canvas font-bold shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  } disabled:opacity-50`}
                  title="Local Ollama: 100% private sovereign local AI"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Local Ollama</span>
                </button>
              </div>
            </div>

            {/* Inference Status Badge */}
            <div className="flex items-center gap-2">
              {inferenceMode === 'gemini' ? (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 font-bold">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Cloud Inference • Ultra-Fast</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1.5 font-bold">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  <span>Sovereign Local AI</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Phone Call Stage */}
          <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-6 md:p-8 flex flex-col items-center justify-between min-h-[490px] shadow-lg relative overflow-hidden transition-colors">
            {/* Top Status Strip */}
            <div className="w-full flex items-center justify-between">
              <StatusBadge state={callState} isMuted={isMuted} />
              {transferBanner && (
                <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 animate-pulse shadow-sm">
                  <PhoneForwarded className="w-3.5 h-3.5 text-amber-400" />
                  {transferBanner}
                </span>
              )}
              {isInCall && (
                <span className="font-mono text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/25 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {formatDuration(duration)}
                </span>
              )}
            </div>

            {/* Central 3D Acoustic Core */}
            <div className="w-full my-auto flex flex-col items-center justify-center py-4">
              <VoiceCore3D
                state={mapVoiceCoreState()}
                audioLevel={callState === 'speaking' ? assistantLevel : userLevel}
                size={240}
                interactive={false}
              />

              <div className="text-center mt-3 max-w-sm space-y-1">
                <h4 className="font-bold text-sm text-text-primary">
                  {isInCall
                    ? activeSquad && activeMember
                      ? `${activeMember.name} (${activeMember.role})`
                      : callState === 'listening'
                      ? 'Listening... Speak in Marathi, Hindi, or English'
                      : callState === 'thinking'
                      ? 'AI is formulating answer...'
                      : 'AI Speaking in Real-Time'
                    : activeSquad && activeMember
                    ? `${activeSquad.name} — ${activeMember.name}`
                    : selectedAgent
                    ? selectedAgent.name
                    : 'Voice Core Standby'}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {isInCall
                    ? activeSquad
                      ? `Connected to Squad Step ${currentMemberIdx + 1} of ${activeSquad.members.length}. ${inferenceMode === 'gemini' ? 'Gemini 2.0 Flash' : 'Local Ollama'} Active.`
                      : `Real-time full-duplex conversational audio with sub-329ms latency via ${inferenceMode === 'gemini' ? 'Gemini Cloud' : 'Local Ollama'}.`
                    : activeSquad && activeMember
                    ? `Lead Triage: ${activeMember.language} • ${activeMember.voice.split('-')[2] || activeMember.voice} voice`
                    : selectedAgent
                    ? `Configured in ${selectedAgent.language.toUpperCase()} • ${selectedAgent.voice.split('-')[2] || selectedAgent.voice} voice`
                    : 'Select an assistant below and tap Start Call.'}
                </p>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="w-full mb-3 p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Call Controls Bar */}
            <div className="w-full flex items-center justify-center gap-3 pt-4 border-t border-border-subtle flex-wrap">
              {isInCall && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3.5 rounded-full border transition-all ${
                    isMuted
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-obsidian-elevated text-text-secondary border-border-subtle hover:text-text-primary'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* SQUAD LIVE WARM TRANSFER BUTTON */}
              {isInCall && activeSquad && nextMember && (
                <button
                  type="button"
                  disabled={transferring}
                  onClick={() => handleWarmTransfer(currentMemberIdx + 1)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
                  title={`Execute warm transfer to ${nextMember.name}`}
                >
                  <PhoneForwarded className="w-4 h-4 text-amber-400" />
                  <span>Warm Transfer to {nextMember.name}</span>
                </button>
              )}

              {!isInCall ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>
                    {activeSquad ? `Start Call Through Squad` : `Start Voice Call`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={endCall}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </div>

          {/* SQUAD MEMBER DETAILS or SINGLE ASSISTANT SELECTOR */}
          {activeSquad ? (
            <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-4 shadow-sm space-y-3">
              <label className="block text-xs font-mono font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  Squad Telephony Routing
                </span>
                <span className="text-[10px] text-text-tertiary font-normal">
                  Zero Call Drops
                </span>
              </label>

              <div className="space-y-2">
                {activeSquad.members.map((member, idx) => {
                  const isActive = idx === currentMemberIdx;
                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        isActive
                          ? 'bg-obsidian-elevated border-amber-500/40 text-text-primary'
                          : 'bg-obsidian-surface border-border-subtle text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isActive ? 'bg-amber-500 text-obsidian-canvas' : 'bg-obsidian-elevated text-text-tertiary'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{member.name}</div>
                          <div className="text-[10px] text-text-tertiary">{member.role}</div>
                        </div>
                      </div>

                      {isInCall && !isActive && (
                        <button
                          type="button"
                          onClick={() => handleWarmTransfer(idx)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 text-[10px] font-bold transition cursor-pointer"
                        >
                          Transfer Now
                        </button>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/15">
                          ON CALL
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-4 shadow-sm space-y-3">
              <label className="block text-xs font-mono font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Switch Assistant
                </span>
                <span className="text-[10px] text-text-tertiary font-normal">
                  Click to route call
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border-subtle">
                {agents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      disabled={isInCall}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-obsidian-elevated border-amber-500/50 shadow-sm text-text-primary ring-1 ring-amber-500/30'
                          : 'bg-obsidian-surface border-border-subtle text-text-secondary hover:bg-obsidian-elevated hover:text-text-primary'
                      } disabled:opacity-50 cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate max-w-[120px]">{agent.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-border-subtle text-amber-500">
                          {agent.language.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-1 truncate">
                        {agent.voice.split('-')[2] || agent.voice}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Spoken Transcript Panel */}
        <div className="lg:col-span-6 flex flex-col h-[550px]">
          <Transcript transcript={transcript} callState={callState} />
        </div>
      </div>
    </div>
  );
}