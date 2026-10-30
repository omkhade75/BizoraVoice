'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Upload,
  Play,
  Pause,
  Trash2,
  PhoneForwarded,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  PhoneCall,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  startCampaign,
  pauseCampaign,
  deleteCampaign,
  getAgents,
  Campaign,
  Agent,
} from '@/lib/api';

const SAMPLE_CONTACTS_MARATHI = `Anil Shinde, +919822012345, Alphonso Mango Pulp, Rs 4500/crate, Ratnagiri
Suresh Kadam, +919823054321, Grade-A Organic Turmeric, Rs 3200/bag, Sangli
Pooja Deshmukh, +919824098765, Certified Soybean Seed, Rs 2800/bag, Latur
Ganesh Pawar, +919825045678, Kolhapur Jaggery Blocks, Rs 1900/box, Kolhapur
Mahesh Patil, +919826078901, Nashik Red Onion Sacks, Rs 1400/bag, Nashik`;

const SAMPLE_CONTACTS_HINDI = `Rajesh Sharma, +919811012345, Basmati Rice Grade 1, Rs 4200/quintal, Karnal
Sunita Verma, +919812054321, Sharbati Wheat Sacks, Rs 3100/bag, Sehore
Vikram Singh, +919813098765, Mustard Oil Tins, Rs 2100/tin, Bharatpur`;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Form State
  const [campaignName, setCampaignName] = useState('Maharashtra Agro-Suppliers Outbound RFQ');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [telephonyProvider, setTelephonyProvider] = useState<'simulation' | 'twilio' | 'sip_gsm'>('simulation');
  const [callerPhone, setCallerPhone] = useState('+919820011223');
  const [csvText, setCsvText] = useState(SAMPLE_CONTACTS_MARATHI);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);

  // Polling for live status
  useEffect(() => {
    loadData();
    const interval = setInterval(refreshActiveCampaign, 3000);
    return () => clearInterval(interval);
  }, [selectedCampaign?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, aList] = await Promise.all([getCampaigns(), getAgents()]);
      setCampaigns(cList);
      setAgents(aList);
      if (aList.length > 0 && !selectedAgentId) {
        setSelectedAgentId(aList[0].id);
      }
      if (cList.length > 0 && !selectedCampaign) {
        const full = await getCampaign(cList[0].id);
        setSelectedCampaign(full);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const updated = await getCampaign(selectedCampaign.id);
      setSelectedCampaign(updated);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
    } catch (err) {
      console.error('Error polling campaign:', err);
    }
  };

  const handleSelectCampaign = async (c: Campaign) => {
    try {
      const full = await getCampaign(c.id);
      setSelectedCampaign(full);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !selectedAgentId || !csvText.trim()) return;

    setCreating(true);
    try {
      const lines = csvText.trim().split('\n');
      const contacts = lines
        .map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          if (parts.length >= 2) {
            const [name, phone, item, amount, city] = parts;
            return {
              name: name || 'Valued Customer',
              phone_number: phone || '+919800000000',
              variables: {
                item: item || 'Catalog Goods',
                amount: amount || 'Standard Quote',
                city: city || 'Maharashtra',
              },
            };
          }
          return null;
        })
        .filter(Boolean) as any[];

      if (contacts.length === 0) {
        alert('Please provide at least one valid row (Name, Phone, Item, Amount, City)');
        return;
      }

      const newCamp = await createCampaign({
        name: campaignName,
        agent_id: selectedAgentId,
        telephony_provider: telephonyProvider,
        caller_phone: callerPhone,
        contacts,
      });

      setCampaigns((prev) => [newCamp, ...prev]);
      setSelectedCampaign(newCamp);
      alert(`Campaign "${newCamp.name}" created with ${contacts.length} recipients!`);
    } catch (err: any) {
      alert(`Error creating campaign: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleStartCampaign = async (id: string) => {
    try {
      await startCampaign(id);
      refreshActiveCampaign();
    } catch (err: any) {
      alert(`Error starting campaign: ${err.message}`);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseCampaign(id);
      refreshActiveCampaign();
    } catch (err: any) {
      alert(`Error pausing campaign: ${err.message}`);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
    } catch (err: any) {
      alert(`Error deleting campaign: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide uppercase">
              100% Free Bulk Calling
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold tracking-wide uppercase">
              Zero OTP Pre-Verification
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold tracking-wide">
              Direct Twilio + 4G GSM VoLTE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-400" />
            Bulk Outbound Calling & Contact Dialer
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
            Upload contact lists with dynamic variables (name, amount, item, city) and execute automated outbound calls.
            Supports direct production Twilio or standard ₹299/mo GSM VoLTE SIM gateways with zero Vapi markup and zero recipient verification blocks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showComparison ? 'Hide Vapi vs Bizora Comparison' : 'Vapi.ai vs Bizora Voice Comparison'}
        </button>
      </div>

      {/* Comparison Drawer / Matrix */}
      {showComparison && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-amber-500/30 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Side-by-Side Comparison: Vapi.ai vs Bizora Voice
            </h3>
            <span className="text-xs text-amber-400 font-mono">Why Bizora Voice Replaces Vapi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase">
                  <th className="py-2.5 px-3">Capability</th>
                  <th className="py-2.5 px-3 text-amber-400 font-bold">Vapi.ai (Cloud SaaS)</th>
                  <th className="py-2.5 px-3 text-emerald-400 font-bold">Bizora Voice (100% Self-Hosted)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Bulk Outbound Calling</td>
                  <td className="py-2.5 px-3 text-red-400/90">Locked behind paid tier ($500+/mo Growth) + per-min markup</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">100% Free & Unlimited on your own server</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Phone Pre-Verification</td>
                  <td className="py-2.5 px-3 text-red-400/90">Twilio trial blocks unverified numbers (must verify via OTP)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Calls ANY number directly via production Twilio or GSM VoLTE</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Cost per Minute</td>
                  <td className="py-2.5 px-3 text-red-400/90">~$0.15 to $0.25 / minute (₹13 to ₹22/min)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">₹0 AI inference + ₹299/mo unlimited Indian SIM</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Multi-Tenancy & Data Isolation</td>
                  <td className="py-2.5 px-3 text-zinc-400">Shared multi-tenant cloud; data stored on Vapi servers</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Local SQLite/PostgreSQL; 100% user-isolated & private</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Regional Asian Voices</td>
                  <td className="py-2.5 px-3 text-zinc-400">Generic English/Hindi with robotic cloud accents</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Native Marathi (Aarohi/Manohar), Hindi, Gujarati, Tamil (24kHz HD)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">Telephony Hardware Freedom</td>
                  <td className="py-2.5 px-3 text-zinc-400">Cloud WebRTC and Twilio only</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Twilio + 4G GSM Gateway (GoIP/Dinstar) + SIP Trunking</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid: Creator on Left, Active Campaign on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create Outbound Campaign */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100 text-sm">Create New Outbound Campaign</h2>
                <p className="text-xs text-zinc-400">Import numbers and map dynamic variables</p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Maharashtra Turmeric Suppliers Outreach"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500/50 transition font-medium"
                />
              </div>

              {/* Agent Picker */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  AI Voice Agent & Language
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500/50 transition font-medium"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.language.toUpperCase()} • {a.voice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Telephony Provider Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Outbound Telephony Route
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('simulation')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'simulation'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">Local Sim</span>
                    <span className="text-[9px] text-zinc-500">100% Free Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('sip_gsm')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'sip_gsm'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">4G GSM Gateway</span>
                    <span className="text-[9px] text-zinc-500">₹299/mo Unlimited</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('twilio')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'twilio'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">Direct Twilio</span>
                    <span className="text-[9px] text-zinc-500">Zero Vapi Markup</span>
                  </button>
                </div>
              </div>

              {/* Caller ID */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Outbound Caller ID (Phone Number)
                </label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="+919820011223"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500/50 transition font-mono"
                />
              </div>

              {/* CSV Contacts Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Contacts List (Name, Phone, Item, Amount, City)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCsvText(SAMPLE_CONTACTS_MARATHI)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Marathi Sample
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      type="button"
                      onClick={() => setCsvText(SAMPLE_CONTACTS_HINDI)}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Hindi Sample
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Anil Shinde, +919822012345, Mango Pulp, Rs 4500, Ratnagiri"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition resize-none leading-relaxed"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Each line: <code className="text-zinc-400">Name, Phone, Item, Amount, City</code>. Automatically templated into agent speech.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <PhoneForwarded className="w-4 h-4" />
                    Create Outbound Campaign
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Stats or Previous Campaigns List */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Saved Campaigns ({campaigns.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCampaign(c)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedCampaign?.id === c.id
                      ? 'bg-zinc-800/80 border-emerald-500/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-zinc-200 truncate">{c.name}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{c.total_contacts} contacts</span>
                      <span>•</span>
                      <span className="capitalize">{c.telephony_provider}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                      c.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : c.status === 'running'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Campaign Monitor & Contact Call Records */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCampaign ? (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-6">
              {/* Campaign Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase border ${
                        selectedCampaign.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : selectedCampaign.status === 'running'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Route: {selectedCampaign.telephony_provider.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-100">{selectedCampaign.name}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Agent: <span className="text-emerald-400 font-medium">{selectedCampaign.agent_name}</span> • Caller ID: {selectedCampaign.caller_phone || 'Default'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCampaign.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => handlePauseCampaign(selectedCampaign.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartCampaign(selectedCampaign.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Launch Outbound Calls
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Counters & Savings Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 font-medium">Recipients</div>
                  <div className="text-xl font-bold text-zinc-100 mt-1">
                    {selectedCampaign.total_contacts}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 font-medium">Completed Calls</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {selectedCampaign.completed_calls}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 font-medium">Total Duration</div>
                  <div className="text-xl font-bold text-zinc-100 mt-1 font-mono">
                    {Math.floor(selectedCampaign.total_duration_sec / 60)}m {selectedCampaign.total_duration_sec % 60}s
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] text-emerald-400 font-medium">Vapi Bill Saved</div>
                  <div className="text-xl font-bold text-emerald-300 mt-1">
                    ₹{selectedCampaign.cost_saved_inr}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                  <span>Batch Completion</span>
                  <span>
                    {selectedCampaign.total_contacts > 0
                      ? Math.round((selectedCampaign.completed_calls / selectedCampaign.total_contacts) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${
                        selectedCampaign.total_contacts > 0
                          ? (selectedCampaign.completed_calls / selectedCampaign.total_contacts) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Contact List Table with Expandable Transcripts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                    Recipient Dialing Log ({selectedCampaign.contacts?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={refreshActiveCampaign}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {selectedCampaign.contacts && selectedCampaign.contacts.length > 0 ? (
                    selectedCampaign.contacts.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                              {c.name}
                              <span className="font-mono text-[11px] text-zinc-400 font-normal">
                                {c.phone_number}
                              </span>
                            </div>
                            {c.variables && (
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                {c.variables.item && <span>Item: {c.variables.item}</span>}
                                {c.variables.amount && <span>• Rate: {c.variables.amount}</span>}
                                {c.variables.city && <span>• City: {c.variables.city}</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                                c.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : c.status === 'calling'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                              }`}
                            >
                              {c.status}
                            </span>
                            {c.duration > 0 && (
                              <span className="text-[10px] text-zinc-500 font-mono">{c.duration}s</span>
                            )}
                          </div>
                        </div>

                        {/* Transcript Toggle */}
                        {c.transcript && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTranscriptId(expandedTranscriptId === c.id ? null : c.id)
                              }
                              className="text-[11px] text-emerald-400/90 hover:text-emerald-300 font-medium flex items-center gap-1"
                            >
                              {expandedTranscriptId === c.id ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" /> Hide Spoken Dialogue
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" /> View Spoken Dialogue
                                </>
                              )}
                            </button>

                            {expandedTranscriptId === c.id && (
                              <div className="mt-2 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 font-mono whitespace-pre-line leading-relaxed">
                                {c.transcript}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      No contacts found in this campaign.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-3">
              <Users className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-300">Select or Create a Campaign</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Fill in the form on the left or click a sample list to test automated outbound dialing in Marathi, Hindi, or English.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
