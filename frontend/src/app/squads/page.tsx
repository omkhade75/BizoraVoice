'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GitFork,
  ArrowRight,
  Plus,
  Bot,
  Sparkles,
  PhoneForwarded,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Settings2,
} from 'lucide-react';

interface SquadMember {
  id: string;
  name: string;
  role: string;
  language: string;
  voice: string;
  transferPhrase: string;
}

interface Squad {
  id: string;
  name: string;
  description: string;
  leadAgent: string;
  members: SquadMember[];
  handoffPolicy: string;
  activeCalls: number;
}

const INITIAL_SQUADS: Squad[] = [
  {
    id: 'squad-inbound-triage',
    name: 'Multilingual Inbound Customer Desk',
    description: 'Front-desk triage bot that greets incoming callers, detects spoken language (Marathi, Hindi, or English), and transfers seamlessly without call drops.',
    leadAgent: 'Receptionist Triage (Auto-Detect)',
    activeCalls: 3,
    handoffPolicy: 'Warm transfer with shared conversation context payload',
    members: [
      {
        id: 'member-1',
        name: 'Receptionist Triage',
        role: 'Initial Greeter & Intent Classifier',
        language: 'Marathi / Hindi / English',
        voice: 'mr-IN-AarohiNeural',
        transferPhrase: 'Let me connect you directly with our Marathi support specialist.',
      },
      {
        id: 'member-2',
        name: 'Marathi Supplier Closer',
        role: 'APMC Pricing & Wholesale Negotiations',
        language: 'Marathi (मराठी)',
        voice: 'mr-IN-ManoharNeural',
        transferPhrase: 'I will transfer you to order logistics to finalize the truck freight.',
      },
      {
        id: 'member-3',
        name: 'Billing & Account Desk',
        role: 'Payment links & Invoice inquiries',
        language: 'Hindi & English',
        voice: 'hi-IN-SwaraNeural',
        transferPhrase: 'Transferring to payment verification.',
      },
    ],
  },
  {
    id: 'squad-healthcare',
    name: 'Dental & Hospital Patient Concierge',
    description: 'Patient symptom intake desk that triages emergencies, schedules dentist appointments, and sends instant WhatsApp confirmation.',
    leadAgent: 'Dr. Patil Front Desk',
    activeCalls: 1,
    handoffPolicy: 'Immediate transfer to on-call surgeon on emergency keywords',
    members: [
      {
        id: 'member-4',
        name: 'Clinic Receptionist',
        role: 'General appointment intake',
        language: 'Hindi / English',
        voice: 'hi-IN-SwaraNeural',
        transferPhrase: 'Connecting you with Dr. Patil care coordinator.',
      },
      {
        id: 'member-5',
        name: 'Emergency Dental Triage',
        role: 'Severe toothache & trauma assessment',
        language: 'Hindi / Marathi',
        voice: 'mr-IN-ManoharNeural',
        transferPhrase: 'Escalating to doctor immediately.',
      },
    ],
  },
];

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>(INITIAL_SQUADS);
  const [selectedSquad, setSelectedSquad] = useState<Squad>(INITIAL_SQUADS[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
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
    setShowCreateModal(false);
    setNewSquadName('');
    setNewSquadDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Squads & Multi-Agent Workflows
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Vapi-Grade
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Orchestrate teams of AI voice agents that pass live callers between each other with zero call drops and shared conversation memory.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Squad</span>
        </button>
      </div>

      {/* Main Grid: Squad List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Squads List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
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
                    ? 'border-emerald-500 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{squad.name}</h3>
                      <div className="text-[11px] text-zinc-500">{squad.members.length} Agents connected</div>
                    </div>
                  </div>
                  {squad.activeCalls > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {squad.activeCalls} Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 line-clamp-2">
                  {squad.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Squad Visual Workflow & Transfer Rules */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Squad Orchestration Flow
                </div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedSquad.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {selectedSquad.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-zinc-500">Lead Receptionist:</span>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{selectedSquad.leadAgent}</div>
              </div>
            </div>

            {/* Handoff Strategy Card */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <GitFork className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Handoff Policy:</strong> {selectedSquad.handoffPolicy}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                Zero Latency Gap
              </span>
            </div>

            {/* Sequential Squad Node Pipeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Connected Agents & Transfer Rules:
              </div>

              {selectedSquad.members.map((member, idx) => (
                <div key={member.id} className="relative">
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.name}</h4>
                          <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {member.language}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{member.role}</p>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 italic mt-1.5 flex items-center gap-1.5">
                          <PhoneForwarded className="w-3 h-3" />
                          <span>Handoff cue: “{member.transferPhrase}”</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/agents"
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Edit Agent
                      </Link>
                    </div>
                  </div>

                  {idx < selectedSquad.members.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0.5 h-3 bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/call"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Create New Agent Squad
            </h3>
            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Squad Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marathi APMC Sales Team"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description & Routing Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe how calls should flow between agents..."
                  value={newSquadDesc}
                  onChange={(e) => setNewSquadDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
