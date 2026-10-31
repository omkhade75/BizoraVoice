'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCall } from '@/hooks/useCall';
import { VoiceCore3D, VoiceCoreState } from './VoiceCore3D';
import { Transcript } from './Transcript';
import { StatusBadge } from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { Agent, getAgents } from '@/lib/api';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export function CallPanel() {
  const searchParams = useSearchParams();
  const queryAgentId = searchParams?.get('agent') || searchParams?.get('agent_id');

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
  } = useCall();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    getAgents()
      .then((data) => {
        setAgents(data);
        if (data.length > 0) {
          // If query param specifies an agent (e.g. /call?agent=agent_maya_medicare), prioritize it!
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
  }, [queryAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleStartCall = () => {
    startCall(selectedAgentId || undefined, selectedAgent?.language);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto items-start">
      {/* Left Column: Interactive Call Stage */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        {/* Main Phone Call Stage */}
        <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-6 md:p-8 flex flex-col items-center justify-between min-h-[490px] shadow-lg relative overflow-hidden transition-colors">
          {/* Top Status Strip */}
          <div className="w-full flex items-center justify-between">
            <StatusBadge state={callState} isMuted={isMuted} />
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
                  ? callState === 'listening'
                    ? 'Listening... Speak in Marathi, Hindi, or English'
                    : callState === 'thinking'
                    ? 'AI is formulating answer...'
                    : 'AI Speaking in Real-Time'
                  : selectedAgent
                  ? selectedAgent.name
                  : 'Voice Core Standby'}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {isInCall
                  ? 'Real-time full-duplex conversational audio with sub-329ms latency.'
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
          <div className="w-full flex items-center justify-center gap-4 pt-4 border-t border-border-subtle">
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

            {!isInCall ? (
              <button
                type="button"
                onClick={handleStartCall}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={endCall}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Assistant Selector */}
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
                  } disabled:opacity-50`}
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
      </div>

      {/* Right Column: Live Spoken Transcript Panel */}
      <div className="lg:col-span-6 flex flex-col h-[550px]">
        <Transcript transcript={transcript} callState={callState} />
      </div>
    </div>
  );
}
