'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GitFork,
  Plus,
  Bot,
  PhoneForwarded,
} from 'lucide-react';
import { Squad, SquadMember, INITIAL_SQUADS, getSquads, API_BASE, getAuthToken } from '@/lib/api';

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>(INITIAL_SQUADS);
  const [selectedSquad, setSelectedSquad] = useState<Squad>(INITIAL_SQUADS[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadSquads() {
      try {
        const loaded = await getSquads();
        if (loaded && loaded.length > 0) {
          setSquads(loaded);
          setSelectedSquad(loaded[0]);
        }
      } catch {
        // Fall back to INITIAL_SQUADS
      }
    }
    loadSquads();
  }, []);

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/squads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newSquadName,
          description: newSquadDesc || 'Custom multi-agent squad',
          members: [],
        }),
      });

      if (res.ok) {
        const newD = await res.json();
        const created: Squad = {
          id: newD.id,
          name: newD.name,
          description: newD.description,
          leadAgent: 'Lead Triage Agent',
          activeCalls: 0,
          handoffPolicy: 'Dynamic handoff rule enabled',
          members: [
            {
              id: `m-${Date.now()}`,
              name: 'Lead Greeter',
              role: 'Initial Triage',
              language: 'Hindi / English / Marathi',
              voice: 'mr-IN-AarohiNeural',
              transferPhrase: 'Transferring to specialist...',
            },
          ],
        };
        setSquads([created, ...squads]);
        setSelectedSquad(created);
      }
    } catch {
      const created: Squad = {
        id: `squad-${Date.now()}`,
        name: newSquadName,
        description: newSquadDesc || 'Custom multi-agent routing squad.',
        leadAgent: 'Default Inbound Agent',
        activeCalls: 0,
        handoffPolicy: 'Contextual handoff on customer intent trigger',
        members: [
          {
            id: `m-${Date.now()}-1`,
            name: 'Lead Greeter',
            role: 'Triage',
            language: 'Hindi / English',
            voice: 'hi-IN-SwaraNeural',
            transferPhrase: 'Connecting you with specialist...',
          },
        ],
      };
      setSquads([created, ...squads]);
      setSelectedSquad(created);
    } finally {
      setIsLoading(false);
      setNewSquadName('');
      setNewSquadDesc('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              <Users className="w-6 h-6 text-amber-500" />
              Squads & Multi-Agent Workflows
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Vapi Swarm Grade
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Orchestrate swarms of voice agents that pass live callers between each other with zero call drops and shared conversation memory.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Squad</span>
        </button>
      </div>

      {/* Main Grid: Squad List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Squads List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary">
            Active Squads ({squads.length})
          </div>
          {squads.map((squad) => {
            const isSelected = selectedSquad.id === squad.id;
            return (
              <div
                key={squad.id}
                onClick={() => setSelectedSquad(squad)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-obsidian-surface shadow-xs ring-1 ring-amber-500/30'
                    : 'border-border-subtle bg-obsidian-surface hover:border-border-medium'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-obsidian-canvas text-amber-500 border border-border-subtle flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{squad.name}</h3>
                      <div className="text-[11px] text-text-tertiary">{squad.members.length} Agents connected</div>
                    </div>
                  </div>
                  {squad.activeCalls > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {squad.activeCalls} Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-2.5 line-clamp-2">
                  {squad.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Squad Visual Workflow & Transfer Rules */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-6">
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  Squad Orchestration Flow
                </div>
                <h2 className="text-lg font-bold text-text-primary mt-0.5">
                  {selectedSquad.name}
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  {selectedSquad.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-text-tertiary">Lead Receptionist:</span>
                <div className="text-xs font-bold text-text-primary font-mono">{selectedSquad.leadAgent}</div>
              </div>
            </div>

            {/* Handoff Strategy Card */}
            <div className="p-3.5 rounded-xl bg-obsidian-elevated border border-border-subtle flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Handoff Policy:</strong> {selectedSquad.handoffPolicy}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                Zero Latency Gap
              </span>
            </div>

            {/* Sequential Squad Node Pipeline */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-text-primary">
                Connected Agents & Transfer Rules:
              </div>

              {selectedSquad.members.map((member, idx) => (
                <div key={member.id} className="relative">
                  <div className="p-4 rounded-xl border border-border-subtle bg-obsidian-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-obsidian-elevated text-text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-border-subtle">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-text-primary">{member.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-obsidian-elevated text-text-secondary">
                            {member.language}
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5">{member.role}</p>
                        <div className="text-[11px] text-amber-500 italic mt-1.5 flex items-center gap-1.5 font-mono">
                          <PhoneForwarded className="w-3 h-3" />
                          <span>Handoff cue: “{member.transferPhrase}”</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/agents"
                        className="px-2.5 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-obsidian-elevated transition"
                      >
                        Edit Agent
                      </Link>
                    </div>
                  </div>

                  {idx < selectedSquad.members.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0.5 h-3 bg-border-subtle" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href={`/call?squad=${selectedSquad?.id || ''}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
              >
                <Bot className="w-4 h-4" />
                <span>Simulate Call Through Squad</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Create Squad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              Create New Agent Squad
            </h3>
            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Squad Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marathi APMC Sales Team"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Description & Routing Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe how calls should flow between agents..."
                  value={newSquadDesc}
                  onChange={(e) => setNewSquadDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-obsidian-elevated transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
                >
                  {isLoading ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
