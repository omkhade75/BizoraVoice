'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Agent,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  CreateAgentPayload,
} from '@/lib/api';
import { AgentCard } from '@/components/AgentCard';
import { AgentForm } from '@/components/AgentForm';
import { Plus, Bot, Sparkles, Filter } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [filterLang, setFilterLang] = useState<string>('all');

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreateOrUpdate = async (data: CreateAgentPayload) => {
    if (editingAgent) {
      await updateAgent(editingAgent.id, data);
    } else {
      await createAgent(data);
    }
    await loadAgents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(id);
      await loadAgents();
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleSelectCall = (id: string) => {
    router.push(`/call?agent=${id}`);
  };

  const filteredAgents =
    filterLang === 'all' ? agents : agents.filter((a) => a.language === filterLang);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              MULTILINGUAL AGENT FACTORY
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
              OLLAMA BACKED
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            AI Voice Agents Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Configure system prompts, initial spoken greetings, regional Asian voices (मराठी, हिन्दी,
            ગુજરાતી), and temperature for each persona.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAgent(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/40 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Voice Agent</span>
        </button>
      </div>

      {/* Language Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl w-fit text-xs">
        {[
          { id: 'all', label: 'All Agents' },
          { id: 'mr', label: 'मराठी (Marathi)' },
          { id: 'hi', label: 'हिन्दी (Hindi)' },
          { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
          { id: 'en', label: 'English' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterLang(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              filterLang === tab.id
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">Loading voice agents...</div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-12 text-center flex flex-col items-center">
          <Bot className="w-10 h-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No agents found for this filter</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mb-4">
            Create an agent in this language or switch filters.
          </p>
          <button
            onClick={() => {
              setEditingAgent(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSelectCall={handleSelectCall}
            />
          ))}
        </div>
      )}

      <AgentForm
        isOpen={isFormOpen}
        initialData={editingAgent}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
}
