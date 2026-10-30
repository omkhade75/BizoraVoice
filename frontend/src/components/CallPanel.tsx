'use client';

import React, { useEffect, useState } from 'react';
import { useCall } from '@/hooks/useCall';
import { AudioVisualizer } from './AudioVisualizer';
import { Transcript } from './Transcript';
import { StatusBadge } from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { Agent, getAgents } from '@/lib/api';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Sparkles, Layers } from 'lucide-react';

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
        {/* Call Box */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 md:p-8 flex flex-col items-center justify-between min-h-[460px] shadow-xl relative overflow-hidden">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between">
            <StatusBadge state={callState} isMuted={isMuted} />
            {isInCall && (
              <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {formatDuration(duration)}
              </span>
            )}
          </div>

          {/* Central Visualizer Area */}
          <div className="w-full my-auto flex flex-col items-center justify-center py-6">
            <AudioVisualizer
              userLevel={userLevel}
              assistantLevel={assistantLevel}
              state={callState}
              isMuted={isMuted}
            />

            <p className="text-xs text-zinc-400 mt-3 text-center max-w-sm leading-relaxed">
              {isInCall
                ? callState === 'listening'
                  ? 'Listening to your microphone... Speak naturally'
                  : callState === 'thinking'
                  ? 'Thinking & generating neural voice chunk...'
                  : 'Assistant speaking in real-time'
                : selectedAgent
                ? `Ready to talk with ${selectedAgent.name} (${selectedAgent.language.toUpperCase()})`
                : 'Select an agent below and tap Start Voice Call'}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="w-full mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="w-full flex items-center justify-center gap-4 pt-4 border-t border-zinc-800">
            {isInCall && (
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3.5 rounded-full border transition-all ${
                  isMuted
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
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
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={endCall}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950/40 hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            )}
          </div>
        </div>

        {/* Agent Selector Card */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Active Voice Agent
            </label>
            <p className="text-[11px] text-zinc-500">
              {selectedAgent?.system_prompt.slice(0, 48)}...
            </p>
          </div>

          <select
            disabled={isInCall}
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3.5 py-2 font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.language.toUpperCase()} • {agent.voice.split('-')[2] || agent.voice})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Column: Live Transcript Panel */}
      <div className="lg:col-span-6 flex flex-col h-[540px]">
        <Transcript transcript={transcript} callState={callState} />
      </div>
    </div>
  );
}
