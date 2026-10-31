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
import { AgentWorkflowCanvas } from '@/components/AgentWorkflowCanvas';
import { Plus, Bot, Filter, LayoutGrid, GitFork, Cloud, Cpu } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [filterLang, setFilterLang] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'canvas'>('cards');
  const [activeCanvasAgentId, setActiveCanvasAgentId] = useState<string>('');

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
      if (data.length > 0 && !activeCanvasAgentId) {
        setActiveCanvasAgentId(data[0].id);
      }
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

  const canvasAgent =
    agents.find((a) => a.id === activeCanvasAgentId) || agents[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              GOOGLE GEMINI CLOUD (0% LAPTOP LOAD)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              LOCAL OLLAMA PARALLEL
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            AI Voice Assistants Studio
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Create, tune, and test voice assistants. Seamlessly switch between Google Gemini cloud inference and local Ollama, pick neural voices, and test right in browser.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                viewMode === 'canvas'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Flow Canvas</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingAgent(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Assistant</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Language Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-fit text-xs font-semibold">
            {[
              { id: 'all', label: 'All Assistants' },
              { id: 'mr', label: 'मराठी (Marathi)' },
              { id: 'hi', label: 'हिन्दी (Hindi)' },
              { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
              { id: 'en', label: 'English' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterLang(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterLang === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500">Loading voice assistants from Supabase...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center">
              <Bot className="w-10 h-10 text-zinc-400 mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No assistants found for this filter</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mb-4">
                Create an assistant in this language or switch filters.
              </p>
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                Create Assistant
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
        </div>
      )}

      {/* Mode 2: Call Flow Canvas */}
      {viewMode === 'canvas' && canvasAgent && (
        <AgentWorkflowCanvas
          agent={canvasAgent}
          onTestCall={handleSelectCall}
        />
      )}

      {/* Modal Form */}
      <AgentForm
        isOpen={isFormOpen}
        initialData={editingAgent}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
}
