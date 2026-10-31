'use client';

import React, { useEffect, useState } from 'react';
import { useCall } from '@/hooks/useCall';
import { AudioVisualizer } from './AudioVisualizer';
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
} from 'lucide-react';

export function CallPanel() {
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
          // Default to Marathi supplier agent if present
          const marathiAgent = data.find((a) => a.language === 'mr');
          setSelectedAgentId(marathiAgent ? marathiAgent.id : data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load agents:', err));
  }, []);

  const handleStartCall = () => {
    startCall(selectedAgentId || undefined);
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-6xl mx-auto items-start">
      {/* Left Column: Interactive Call Stage */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        {/* Main Phone Call Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl border border-zinc-800/90 p-6 md:p-8 flex flex-col items-center justify-between min-h-[480px] shadow-2xl relative overflow-hidden">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between">
            <StatusBadge state={callState} isMuted={isMuted} />
            {isInCall && (
              <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-800/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {formatDuration(duration)}
              </span>
            )}
          </div>

          {/* Central Waveform Visualizer */}
          <div className="w-full my-auto flex flex-col items-center justify-center py-6">
            <AudioVisualizer
              userLevel={userLevel}
              assistantLevel={assistantLevel}
              state={callState}
              isMuted={isMuted}
            />

            <div className="text-center mt-4 max-w-sm space-y-1">
              <h4 className="font-bold text-sm text-zinc-100">
                {isInCall
                  ? callState === 'listening'
                    ? 'Listening... Speak in Marathi, Hindi, or English'
                    : callState === 'thinking'
                    ? 'AI is formulating answer...'
                    : 'AI Speaking in Real-Time'
                  : selectedAgent
                  ? selectedAgent.name
                  : 'Ready to Call'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isInCall
                  ? 'Works like a real telephone call with natural voice turn-taking and zero delay.'
                  : selectedAgent
                  ? `Configured in ${selectedAgent.language.toUpperCase()} (${selectedAgent.voice.split('-')[2] || selectedAgent.voice} voice)`
                  : 'Select an agent below and tap Start Call.'}
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="w-full mb-4 p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Call Controls Bar */}
          <div className="w-full flex items-center justify-center gap-4 pt-5 border-t border-zinc-800/80">
            {isInCall && (
              <button
                type="button"
                onClick={toggleMute}
                className={`p-4 rounded-full border transition-all ${
                  isMuted
                    ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                    : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
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
                className="flex items-center gap-2.5 px-9 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={endCall}
                className="flex items-center gap-2.5 px-9 py-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-rose-950/60 hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Agent Persona Picker Cards */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800/80 p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Switch AI Receptionist
            </span>
            <span className="text-[10px] text-zinc-500 font-normal">
              Click to select
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
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
                      ? 'bg-zinc-800/90 border-emerald-500/50 shadow-sm text-zinc-100 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-950/60 border-zinc-800/70 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate max-w-[120px]">{agent.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                      {agent.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 truncate">
                    {agent.voice.split('-')[2] || agent.voice}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Live Transcript Panel */}
      <div className="lg:col-span-6 flex flex-col h-[540px]">
        <Transcript transcript={transcript} callState={callState} />
      </div>
    </div>
  );
}
