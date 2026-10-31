'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Agent,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  duplicateAgent,
  CreateAgentPayload,
} from '@/lib/api';
import { AgentCard } from '@/components/AgentCard';
import { AgentForm } from '@/components/AgentForm';
import { AgentWorkflowCanvas } from '@/components/AgentWorkflowCanvas';
import { Plus, Bot, LayoutGrid, GitFork, Cloud, Cpu } from 'lucide-react';

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

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateAgent(id);
      await loadAgents();
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              GOOGLE GEMINI 2.5 FLASH
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-border-subtle text-text-secondary border border-border-subtle text-[10px] font-mono font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-500" />
              LOCAL OLLAMA IN PARALLEL
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-amber-500" />
            Voice Assistants Studio
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Create, tune, and orchestrate autonomous voice assistants. Seamlessly switch between Google Gemini cloud inference and local Ollama, pick neural voices, and test turn-taking in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-obsidian-surface border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                viewMode === 'cards'
                  ? 'bg-obsidian-elevated text-text-primary shadow-xs font-semibold'
                  : 'text-text-tertiary hover:text-text-primary'
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
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs font-semibold'
                  : 'text-text-tertiary hover:text-text-primary'
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
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
          <div className="flex items-center gap-1.5 p-1 bg-obsidian-surface border border-border-subtle rounded-xl w-fit text-xs font-mono font-medium">
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
                    ? 'bg-obsidian-elevated text-amber-500 border border-border-subtle font-bold shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-text-tertiary">
              Loading voice assistants from Supabase PostgreSQL...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-obsidian-surface rounded-2xl border border-border-subtle p-12 text-center flex flex-col items-center">
              <Bot className="w-10 h-10 text-text-tertiary mb-3" />
              <h3 className="text-sm font-bold text-text-primary">No assistants found for this filter</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mb-4">
                Create an assistant in this language or switch filters.
              </p>
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-obsidian-canvas text-xs font-bold rounded-xl transition"
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
                  onDuplicate={handleDuplicate}
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
