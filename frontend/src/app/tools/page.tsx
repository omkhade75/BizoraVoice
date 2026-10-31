'use client';

import React, { useState } from 'react';
import {
  Plus,
  Play,
  Zap,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST';
  endpoint: string;
  parameters: { name: string; type: string; description: string; required: boolean }[];
  associatedAgents: string[];
  status: 'active' | 'testing';
}

const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'tool-apmc-rates',
    name: 'Fetch APMC Mandi Rates',
    description: 'Queries live daily wholesale mandi prices for Onion, Soybean, Wheat, and Cotton across Maharashtra markets.',
    method: 'GET',
    endpoint: 'https://bizora-voice-backend.onrender.com/api/tools/apmc-rates?commodity={commodity}&market={market}',
    parameters: [
      { name: 'commodity', type: 'string', description: 'Agricultural crop (e.g. onion, soybean)', required: true },
      { name: 'market', type: 'string', description: 'Mandi center (e.g. nashik, lasalgaon, pune)', required: false },
    ],
    associatedAgents: ['Marathi Supplier Outreach', 'Maharashtra Krishi Kendra'],
    status: 'active',
  },
  {
    id: 'tool-clinic-booking',
    name: 'Book Clinic Appointment',
    description: 'Reserves an outpatient slot on clinic calendar and sends immediate SMS & WhatsApp confirmation to patient.',
    method: 'POST',
    endpoint: 'https://bizora-voice-backend.onrender.com/api/tools/book-appointment',
    parameters: [
      { name: 'patient_name', type: 'string', description: 'Full name of patient', required: true },
      { name: 'slot_time', type: 'string', description: 'Requested appointment time ISO', required: true },
      { name: 'service_type', type: 'string', description: 'Dental cleaning, Root canal, Consultation', required: true },
    ],
    associatedAgents: ['Dr. Patil Dental Care'],
    status: 'active',
  },
  {
    id: 'tool-send-whatsapp',
    name: 'Send WhatsApp Rate Card',
    description: 'Sends PDF quotation or booking details directly to caller WhatsApp number during or after the call.',
    method: 'POST',
    endpoint: 'https://bizora-voice-backend.onrender.com/api/tools/send-whatsapp',
    parameters: [
      { name: 'to_phone', type: 'string', description: 'Recipient phone with country code', required: true },
      { name: 'template_id', type: 'string', description: 'WhatsApp approved message template', required: true },
    ],
    associatedAgents: ['All Assistants'],
    status: 'active',
  },
];

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [selectedTool, setSelectedTool] = useState<Tool>(DEFAULT_TOOLS[0]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Tool Form
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolMethod, setNewToolMethod] = useState<'GET' | 'POST'>('POST');
  const [newToolUrl, setNewToolUrl] = useState('');

  const handleTestTool = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      if (selectedTool.id === 'tool-apmc-rates') {
        setTestResult(
          JSON.stringify(
            {
              status: 'success',
              commodity: 'Onion (कांदा)',
              market: 'Lasalgaon Mandi, Nashik',
              modal_price_inr_quintal: 2450,
              min_price: 1800,
              max_price: 2900,
              recorded_at: new Date().toISOString(),
            },
            null,
            2
          )
        );
      } else {
        setTestResult(
          JSON.stringify(
            {
              status: 'success',
              message: 'Mock webhook executed successfully with HTTP 200 OK.',
              execution_time_ms: 184,
            },
            null,
            2
          )
        );
      }
    }, 600);
  };

  const handleCreateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolUrl.trim()) return;
    const created: Tool = {
      id: `tool-${Date.now()}`,
      name: newToolName,
      description: newToolDesc || 'Custom function tool for live voice calls.',
      method: newToolMethod,
      endpoint: newToolUrl,
      parameters: [{ name: 'query', type: 'string', description: 'User input parameter', required: true }],
      associatedAgents: ['Marathi Supplier Outreach'],
      status: 'active',
    };
    setTools([created, ...tools]);
    setSelectedTool(created);
    setShowAddModal(false);
    setNewToolName('');
    setNewToolDesc('');
    setNewToolUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Tools & Webhook Functions
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Function Calling
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Empower your AI assistants to query external databases, check live inventory, and trigger CRM actions during the voice call.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Tool</span>
        </button>
      </div>

      {/* Main Grid: Tool List & Tool Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tool Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Configured Tools ({tools.length})
          </div>
          {tools.map((t) => {
            const isSelected = selectedTool.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTool(t);
                  setTestResult(null);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {t.method}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {t.parameters.length} params
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 line-clamp-2">
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Tool Schema & Interactive Test Runner */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Function Definition
                </div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedTool.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {selectedTool.description}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {selectedTool.method}
              </span>
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Webhook URL Endpoint
              </label>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all">
                {selectedTool.endpoint}
              </div>
            </div>

            {/* Parameter Schema Table */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Function Parameters (JSON Schema for LLM)
              </label>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {selectedTool.parameters.map((p) => (
                      <tr key={p.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                        <td className="p-3 font-mono font-bold text-zinc-800 dark:text-zinc-200">{p.name}</td>
                        <td className="p-3 text-zinc-500 font-mono">{p.type}</td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-400">{p.description}</td>
                        <td className="p-3">
                          {p.required ? (
                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">Optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Execution Panel */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Live Function Execution Sandbox
                </span>
                <button
                  onClick={handleTestTool}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Executing...' : 'Run Test'}</span>
                </button>
              </div>

              {testResult && (
                <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800">
                  {testResult}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Create Custom Function Tool
            </h3>
            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tool Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check Inventory Stock"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  HTTP Method & URL
                </label>
                <div className="flex gap-2">
                  <select
                    value={newToolMethod}
                    onChange={(e) => setNewToolMethod(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                  <input
                    type="url"
                    required
                    placeholder="https://api.yourcompany.com/webhook"
                    value={newToolUrl}
                    onChange={(e) => setNewToolUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe when the voice assistant should trigger this tool..."
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Save Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
