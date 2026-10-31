'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Upload,
  Play,
  Pause,
  Trash2,
  PhoneForwarded,
  Users,
  Sparkles,
  ShieldCheck,
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
        if (full) setSelectedCampaign(full);
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
      if (updated) {
        setSelectedCampaign(updated);
        setCampaigns((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      }
    } catch (err) {
      console.error('Error polling campaign:', err);
    }
  };

  const handleSelectCampaign = async (c: Campaign) => {
    try {
      const full = await getCampaign(c.id);
      if (full) setSelectedCampaign(full);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
              Bulk Outbound Telephony
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--brand-amber)]/10 text-[var(--brand-amber)] border border-[var(--brand-amber)]/20 font-semibold uppercase tracking-wider">
              Zero OTP Pre-Verification
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-medium">
              Direct Twilio BYOT + 4G GSM
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-[var(--brand-amber)]" />
            Bulk Outbound Campaigns & Contact Dialer
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
            Upload contact lists with dynamic variables (name, amount, item, city) and execute automated outbound calls.
            Supports direct production Twilio or standard ₹299/mo GSM VoLTE SIM gateways with zero cloud markup.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-amber)]/10 hover:bg-[var(--brand-amber)]/20 text-[var(--brand-amber)] border border-[var(--brand-amber)]/30 transition shadow-sm self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showComparison ? 'Hide Vapi vs Bizora' : 'Compare vs Vapi.ai'}
        </button>
      </div>

      {/* Comparison Drawer */}
      {showComparison && (
        <div className="p-6 rounded-xl bg-[var(--surface-card)] border border-[var(--brand-amber)]/30 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--brand-amber)]" />
              Side-by-Side Comparison: Vapi.ai vs Bizora Voice
            </h3>
            <span className="text-xs text-[var(--brand-amber)] font-mono">Developer Infrastructure Advantage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono uppercase">
                  <th className="py-2.5 px-3">Capability</th>
                  <th className="py-2.5 px-3 text-[var(--brand-amber)] font-bold">Vapi.ai (Cloud SaaS)</th>
                  <th className="py-2.5 px-3 text-emerald-400 font-bold">Bizora Voice (Sovereign Infrastructure)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Bulk Outbound Calling</td>
                  <td className="py-2.5 px-3 text-red-400/90">Locked behind paid tier ($500+/mo Growth) + per-min markup</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">100% Free & Unlimited on your own server</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Phone Pre-Verification</td>
                  <td className="py-2.5 px-3 text-red-400/90">Twilio trial blocks unverified numbers (must verify via OTP)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Calls ANY number directly via production Twilio or GSM VoLTE</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Cost per Minute</td>
                  <td className="py-2.5 px-3 text-red-400/90">~$0.15 to $0.25 / minute (₹13 to ₹22/min)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">₹0 AI inference + ₹299/mo unlimited Indian SIM</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Multi-Tenancy & Data Isolation</td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">Shared multi-tenant cloud; data stored on Vapi servers</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Local SQLite/PostgreSQL; 100% user-isolated & private</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Regional Indic Voices</td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">Generic English/Hindi with robotic cloud accents</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Native Marathi (Aarohi/Manohar), Hindi, Gujarati, Tamil (24kHz HD)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Telephony Hardware Freedom</td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">Cloud WebRTC and Twilio only</td>
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
          <div className="p-6 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-amber)]/10 border border-[var(--brand-amber)]/20 text-[var(--brand-amber)] flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--text-primary)] text-sm">Create Outbound Campaign</h2>
                <p className="text-xs text-[var(--text-secondary)]">Import contacts & map dynamic speech variables</p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Maharashtra Turmeric Suppliers Outreach"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-amber)] transition font-medium"
                />
              </div>

              {/* Agent Picker */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  AI Voice Agent & Language
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-amber)] transition font-medium"
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
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Outbound Telephony Route
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('simulation')}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'simulation'
                        ? 'bg-[var(--brand-amber)]/10 border-[var(--brand-amber)] text-[var(--brand-amber)]'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">Local Sim</span>
                    <span className="text-[9px] opacity-75">100% Free Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('sip_gsm')}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'sip_gsm'
                        ? 'bg-[var(--brand-amber)]/10 border-[var(--brand-amber)] text-[var(--brand-amber)]'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">4G GSM Gateway</span>
                    <span className="text-[9px] opacity-75">₹299/mo Unlimited</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('twilio')}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'twilio'
                        ? 'bg-[var(--brand-amber)]/10 border-[var(--brand-amber)] text-[var(--brand-amber)]'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">Direct Twilio</span>
                    <span className="text-[9px] opacity-75">Zero Markup</span>
                  </button>
                </div>
              </div>

              {/* Caller ID */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Outbound Caller ID (Phone Number)
                </label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="+919820011223"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-amber)] transition font-mono"
                />
              </div>

              {/* CSV Contacts Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Contacts List (Name, Phone, Item, Amount, City)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCsvText(SAMPLE_CONTACTS_MARATHI)}
                      className="text-[10px] text-[var(--brand-amber)] hover:underline"
                    >
                      Marathi Sample
                    </button>
                    <span className="text-[var(--text-tertiary)]">•</span>
                    <button
                      type="button"
                      onClick={() => setCsvText(SAMPLE_CONTACTS_HINDI)}
                      className="text-[10px] text-emerald-400 hover:underline"
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--brand-amber)] transition resize-none leading-relaxed"
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Each line: <code className="text-[var(--text-primary)]">Name, Phone, Item, Amount, City</code>. Automatically templated into agent speech.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--brand-amber)] hover:bg-[var(--brand-amber-light)] text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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

          {/* Saved Campaigns List */}
          <div className="p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
              Saved Campaigns ({campaigns.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCampaign(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    selectedCampaign?.id === c.id
                      ? 'bg-[var(--brand-amber)]/10 border-[var(--brand-amber)]/50'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] hover:border-[var(--brand-amber)]/30'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{c.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
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
                        ? 'bg-[var(--brand-amber)]/10 text-[var(--brand-amber)] border-[var(--brand-amber)]/20 animate-pulse'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Campaign Monitor */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCampaign ? (
            <div className="p-6 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl space-y-6">
              {/* Campaign Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase border ${
                        selectedCampaign.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : selectedCampaign.status === 'running'
                          ? 'bg-[var(--brand-amber)]/10 text-[var(--brand-amber)] border-[var(--brand-amber)]/20 animate-pulse'
                          : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                      Route: {(selectedCampaign.telephony_provider || 'GSM').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedCampaign.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Agent: <span className="text-[var(--brand-amber)] font-medium">{selectedCampaign.agent_name}</span> • Caller ID: {selectedCampaign.caller_phone || 'Default'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCampaign.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => handlePauseCampaign(selectedCampaign.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-amber)]/10 hover:bg-[var(--brand-amber)]/20 text-[var(--brand-amber)] border border-[var(--brand-amber)]/30 transition flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartCampaign(selectedCampaign.id)}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-amber)] hover:bg-[var(--brand-amber-light)] text-zinc-950 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Launch Outbound Calls
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border-subtle)] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium">Recipients</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                    {selectedCampaign.total_contacts}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium">Completed Calls</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                    {selectedCampaign.completed_calls}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium">Total Duration</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                    {Math.floor((selectedCampaign.total_duration_sec || 0) / 60)}m {(selectedCampaign.total_duration_sec || 0) % 60}s
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] text-emerald-400 font-medium">Vapi Markup Saved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                    ₹{selectedCampaign.cost_saved_inr || 0}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
                  <span>Batch Completion</span>
                  <span className="font-mono">
                    {selectedCampaign.total_contacts > 0
                      ? Math.round((selectedCampaign.completed_calls / selectedCampaign.total_contacts) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full bg-[var(--brand-amber)] transition-all duration-500"
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

              {/* Contact List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    Dialing Queue ({selectedCampaign.contacts?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={refreshActiveCampaign}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {selectedCampaign.contacts && selectedCampaign.contacts.length > 0 ? (
                    selectedCampaign.contacts.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--brand-amber)]/40 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                              {c.name}
                              <span className="font-mono text-[11px] text-[var(--text-secondary)] font-normal">
                                {c.phone_number}
                              </span>
                            </div>
                            {c.variables && (
                              <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
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
                                  ? 'bg-[var(--brand-amber)]/10 text-[var(--brand-amber)] border-[var(--brand-amber)]/20 animate-pulse'
                                  : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                              }`}
                            >
                              {c.status}
                            </span>
                            {c.duration > 0 && (
                              <span className="text-[10px] text-[var(--text-secondary)] font-mono">{c.duration}s</span>
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
                              className="text-[11px] text-[var(--brand-amber)] hover:underline font-medium flex items-center gap-1"
                            >
                              {expandedTranscriptId === c.id ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" /> Hide Dialogue
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" /> View Dialogue
                                </>
                              )}
                            </button>

                            {expandedTranscriptId === c.id && (
                              <div className="mt-2 p-3 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono whitespace-pre-line leading-relaxed">
                                {c.transcript}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
                      No contacts found in this campaign.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-[var(--surface-card)] border border-dashed border-[var(--border-subtle)] text-center space-y-3">
              <Users className="w-10 h-10 text-[var(--text-tertiary)] mx-auto" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Select or Create a Campaign</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Fill in the form on the left or click a sample list to test automated outbound dialing in Marathi, Hindi, or English.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
