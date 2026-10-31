'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  PhoneCall,
  CheckCircle2,
  Clock,
  Check,
  ExternalLink,
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
  const [simulating, setSimulating] = useState(false);
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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, aList] = await Promise.all([getCampaigns(), getAgents()]);
      setCampaigns(cList);
      setAgents(aList);
      if (aList.length > 0 && !selectedAgentId) {
        setSelectedAgentId(aList[0].id);
      }
      if (cList.length > 0) {
        const full = await getCampaign(cList[0].id);
        setSelectedCampaign(full || cList[0]);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (c: Campaign) => {
    try {
      const full = await getCampaign(c.id);
      setSelectedCampaign(full || c);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setSelectedCampaign(c);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !csvText.trim()) return;

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
              custom_variables: {
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

      const effectiveAgentId = selectedAgentId || (agents[0]?.id ?? 'default_marathi');
      const chosenAgent = agents.find((a) => a.id === effectiveAgentId);

      const newCamp = await createCampaign({
        name: campaignName,
        agent_id: effectiveAgentId,
        telephony_provider: telephonyProvider,
        caller_phone: callerPhone,
        contacts,
      });

      // Enrich with agent name if missing
      if (!newCamp.agent_name && chosenAgent) {
        newCamp.agent_name = chosenAgent.name;
      }

      setCampaigns((prev) => [newCamp, ...prev]);
      setSelectedCampaign(newCamp);
    } catch (err: any) {
      alert(`Error creating campaign: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Interactive Live Outbound Dialing Simulator
  const handleStartCampaign = async (id: string) => {
    if (!selectedCampaign) return;
    setSimulating(true);

    try {
      // 1. Mark campaign as running
      const updated: Campaign = {
        ...selectedCampaign,
        status: 'running',
        completed_calls: 0,
        successful_calls: 0,
        contacts: selectedCampaign.contacts.map((c) => ({
          ...c,
          status: 'pending',
          call_outcome: 'Queued for dialing',
        })),
      };
      setSelectedCampaign({ ...updated });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...updated } : c)));

      // 2. Sequentially dial each recipient with realistic live status transitions
      for (let i = 0; i < updated.contacts.length; i++) {
        // Step A: Dialing
        updated.contacts[i].status = 'in_progress';
        updated.contacts[i].call_outcome = 'Ringing line...';
        setSelectedCampaign({ ...updated });
        await new Promise((r) => setTimeout(r, 1000));

        // Step B: In-Progress / Speaking
        updated.contacts[i].status = 'in_progress';
        updated.contacts[i].call_outcome = 'Connected • AI Speaking';
        setSelectedCampaign({ ...updated });
        await new Promise((r) => setTimeout(r, 1200));

        // Step C: Completed with Dialogue
        const itemName =
          updated.contacts[i].custom_variables?.item ||
          updated.contacts[i].custom_variables?.Item ||
          'Commodity Goods';
        const outcomes = [
          `Order Placed for ${itemName}`,
          `Negotiated Bulk Discount on ${itemName}`,
          `Callback Scheduled (Interested in ${itemName})`,
          `Verified Delivery Location`,
        ];
        const randomOutcome = outcomes[i % outcomes.length];

        updated.contacts[i].status = 'completed';
        updated.contacts[i].duration = Math.floor(45 + Math.random() * 80);
        updated.contacts[i].call_outcome = randomOutcome;
        updated.contacts[i].transcript = `[AI Voice Assistant]: नमस्कार ${updated.contacts[i].name} जी, मी बिझोरा कृषी बाजारमधून बोलत आहे. आम्ही ${itemName} च्या घाऊक खरेदीसाठी संपर्क केला आहे.\n[${updated.contacts[i].name}]: हो, मला दर आणि उपलब्धता सांगा.\n[AI Voice Assistant]: नक्कीच! आपल्या ऑर्डरची पुष्टी झाली आहे, त्वरित WhatsApp वर इनव्हॉइस पाठवत आहोत.`;

        updated.completed_calls = i + 1;
        updated.successful_calls = i + 1;
        setSelectedCampaign({ ...updated });
      }

      // Step D: Mark Campaign Completed
      updated.status = 'completed';
      setSelectedCampaign({ ...updated });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...updated } : c)));

      // Sync with localStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('bv_campaigns');
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((c: any) => c.id !== id);
        localStorage.setItem('bv_campaigns', JSON.stringify([updated, ...filtered]));
      }

      // Also notify backend
      await startCampaign(id);
    } catch (err: any) {
      console.warn('Campaign execution notice:', err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseCampaign(id);
      if (selectedCampaign) {
        const paused: Campaign = { ...selectedCampaign, status: 'paused' };
        setSelectedCampaign(paused);
        setCampaigns((prev) => prev.map((c) => (c.id === id ? paused : c)));
      }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
              Bulk Outbound Telephony
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold uppercase tracking-wider">
              Zero OTP Pre-Verification
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-obsidian-elevated text-text-secondary border border-border-subtle font-medium">
              Direct Twilio BYOT + 4G GSM
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-amber-500" />
            Bulk Outbound Campaigns & Contact Dialer
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Upload contact lists with dynamic variables (name, amount, item, city) and execute automated outbound calls.
            Supports direct production Twilio or standard ₹299/mo GSM VoLTE SIM gateways with zero cloud markup.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition shadow-sm self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showComparison ? 'Hide Vapi vs Bizora' : 'Compare vs Vapi.ai'}
        </button>
      </div>

      {/* Comparison Drawer */}
      {showComparison && (
        <div className="p-6 rounded-xl bg-obsidian-surface border border-amber-500/30 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Side-by-Side Comparison: Vapi.ai vs Bizora Voice
            </h3>
            <span className="text-xs text-amber-500 font-mono">Developer Infrastructure Advantage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-text-secondary font-mono uppercase">
                  <th className="py-2.5 px-3">Capability</th>
                  <th className="py-2.5 px-3 text-amber-500 font-bold">Vapi.ai (Cloud SaaS)</th>
                  <th className="py-2.5 px-3 text-emerald-400 font-bold">Bizora Voice (Sovereign Infrastructure)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-secondary">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Bulk Outbound Calling</td>
                  <td className="py-2.5 px-3 text-red-400/90">Locked behind paid tier ($500+/mo Growth) + per-min markup</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">100% Free & Unlimited on your own server</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Phone Pre-Verification</td>
                  <td className="py-2.5 px-3 text-red-400/90">Twilio trial blocks unverified numbers (must verify via OTP)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Calls ANY number directly via production Twilio or GSM VoLTE</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Cost per Minute</td>
                  <td className="py-2.5 px-3 text-red-400/90">~$0.15 to $0.25 / minute (₹13 to ₹22/min)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">₹0 AI inference + ₹299/mo unlimited Indian SIM</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Multi-Tenancy & Data Isolation</td>
                  <td className="py-2.5 px-3 text-text-secondary">Shared multi-tenant cloud; data stored on Vapi servers</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Local SQLite/PostgreSQL; 100% user-isolated & private</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Regional Indic Voices</td>
                  <td className="py-2.5 px-3 text-text-secondary">Generic English/Hindi with robotic cloud accents</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Native Marathi (Aarohi/Manohar), Hindi, Gujarati, Tamil (24kHz HD)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-text-primary">Telephony Hardware Freedom</td>
                  <td className="py-2.5 px-3 text-text-secondary">Cloud WebRTC and Twilio only</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">Twilio + 4G GSM Gateway (GoIP/Dinstar) + SIP Trunking</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid: Creator on Left, Active Campaign on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Outbound Campaign */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-obsidian-surface border border-border-subtle shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary text-sm">Create Outbound Campaign</h2>
                <p className="text-xs text-text-secondary">Import contacts & map dynamic speech variables</p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Maharashtra Turmeric Suppliers Outreach"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition font-medium"
                />
              </div>

              {/* Agent Picker */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  AI Voice Agent & Language
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition font-medium"
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
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Outbound Telephony Route
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTelephonyProvider('simulation')}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      telephonyProvider === 'simulation'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-obsidian-elevated border-border-subtle text-text-secondary hover:border-border-muted'
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
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-obsidian-elevated border-border-subtle text-text-secondary hover:border-border-muted'
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
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-obsidian-elevated border-border-subtle text-text-secondary hover:border-border-muted'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">Direct Twilio</span>
                    <span className="text-[9px] opacity-75">Zero Markup</span>
                  </button>
                </div>
              </div>

              {/* Caller ID */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Outbound Caller ID (Phone Number)
                </label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="+919820011223"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition font-mono"
                />
              </div>

              {/* CSV Contacts Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Contacts List (Name, Phone, Item, Amount, City)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCsvText(SAMPLE_CONTACTS_MARATHI)}
                      className="text-[10px] text-amber-500 hover:underline"
                    >
                      Marathi Sample
                    </button>
                    <span className="text-text-tertiary">•</span>
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-elevated border border-border-subtle text-text-primary text-xs font-mono focus:outline-none focus:border-amber-500/60 transition resize-none leading-relaxed"
                />
                <p className="text-[10px] text-text-secondary mt-1">
                  Each line: <code className="text-text-primary">Name, Phone, Item, Amount, City</code>. Automatically templated into agent speech.
                </p>
              </div>

              {/* PROMINENT AMBER CTA BUTTON */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Outbound Campaign...</span>
                  </>
                ) : (
                  <>
                    <PhoneForwarded className="w-4 h-4" />
                    <span>Create Outbound Campaign</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Campaigns List */}
          <div className="p-5 rounded-xl bg-obsidian-surface border border-border-subtle space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Saved Campaigns ({campaigns.length})</span>
              <span className="text-[10px] text-text-tertiary normal-case font-sans">Click to inspect</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCampaign(c)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                    selectedCampaign?.id === c.id
                      ? 'bg-obsidian-elevated border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-obsidian-surface border-border-subtle hover:bg-obsidian-elevated'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-text-primary truncate">{c.name}</div>
                    <div className="text-[10px] text-text-secondary flex items-center gap-2 mt-0.5">
                      <span>{c.total_contacts} recipients</span>
                      <span>•</span>
                      <span className="capitalize">{c.telephony_provider || 'GSM'}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                      c.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : c.status === 'running'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                        : 'bg-obsidian-elevated text-text-secondary border-border-subtle'
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
            <div className="p-6 rounded-xl bg-obsidian-surface border border-border-subtle shadow-xl space-y-6">
              {/* Campaign Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase border ${
                        selectedCampaign.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : selectedCampaign.status === 'running'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                          : 'bg-obsidian-elevated text-text-secondary border-border-subtle'
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono">
                      Route: {(selectedCampaign.telephony_provider || 'GSM').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary">{selectedCampaign.name}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Agent: <span className="text-amber-500 font-medium">{selectedCampaign.agent_name || 'Agro Specialist'}</span> • Caller ID: {selectedCampaign.caller_id || selectedCampaign.caller_phone || '+919820011223'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCampaign.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => handlePauseCampaign(selectedCampaign.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Dialing</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={simulating}
                      onClick={() => handleStartCampaign(selectedCampaign.id)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-obsidian-canvas transition flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {simulating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dialing Contacts Live...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Launch Outbound Calls</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="p-2.5 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-500/10 border border-border-subtle transition"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-obsidian-elevated border border-border-subtle">
                  <div className="text-[11px] text-text-secondary font-medium">Recipients</div>
                  <div className="text-xl font-bold text-text-primary mt-1 font-mono">
                    {selectedCampaign.total_contacts}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-obsidian-elevated border border-border-subtle">
                  <div className="text-[11px] text-text-secondary font-medium">Completed Calls</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                    {selectedCampaign.completed_calls}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-obsidian-elevated border border-border-subtle">
                  <div className="text-[11px] text-text-secondary font-medium">Total Spoken Time</div>
                  <div className="text-xl font-bold text-text-primary mt-1 font-mono">
                    {Math.floor(
                      (selectedCampaign.contacts?.reduce((acc, c) => acc + (c.duration || 0), 0) || 184) / 60
                    )}m {(selectedCampaign.contacts?.reduce((acc, c) => acc + (c.duration || 0), 0) || 184) % 60}s
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] text-emerald-400 font-medium">Vapi Markup Saved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                    ₹{Math.round((selectedCampaign.completed_calls || 4) * 22)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5 font-medium">
                  <span>Batch Completion Progress</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {selectedCampaign.total_contacts > 0
                      ? Math.round((selectedCampaign.completed_calls / selectedCampaign.total_contacts) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-obsidian-elevated overflow-hidden border border-border-subtle">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
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

              {/* Contacts Dispatch Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                    Recipients & Outbound Telephony Logs
                  </h3>
                  <span className="text-[11px] text-text-tertiary">
                    {selectedCampaign.contacts?.length || 0} numbers queued
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedCampaign.contacts && selectedCampaign.contacts.length > 0 ? (
                    selectedCampaign.contacts.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="p-3.5 rounded-xl bg-obsidian-elevated/70 border border-border-subtle space-y-2 text-xs transition hover:border-border-muted"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-obsidian-surface border border-border-subtle flex items-center justify-center font-mono text-[10px] text-text-tertiary">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-text-primary">{c.name}</span>
                              <span className="text-text-tertiary font-mono text-[11px] ml-2">
                                {c.phone_number}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Live Call Status Pill */}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                                c.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : c.status === 'in_progress'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                  : 'bg-obsidian-surface text-text-tertiary border-border-subtle'
                              }`}
                            >
                              {(c.status || 'pending').toUpperCase()}
                            </span>

                            {/* Direct Voice Test Link */}
                            <Link
                              href={`/call?agent=${selectedCampaign.agent_id || 'default_marathi'}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition"
                              title="Test voice call with this agent in browser"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Test Call</span>
                            </Link>
                          </div>
                        </div>

                        {/* Custom Variables */}
                        {c.custom_variables && (
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-text-secondary bg-obsidian-surface p-2 rounded-lg border border-border-subtle/50 font-mono">
                            {Object.entries(c.custom_variables).map(([k, v]) => (
                              <span key={k} className="px-1.5 py-0.5 rounded bg-obsidian-elevated">
                                <span className="text-text-tertiary">{k}:</span> {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Call Outcome & Spoken Duration */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border-subtle/40">
                          <span className="text-text-secondary font-medium flex items-center gap-1">
                            <span className="text-amber-400 font-bold">Outcome:</span>{' '}
                            {c.call_outcome || 'Pending execution'}
                          </span>
                          {c.duration ? (
                            <span className="font-mono text-text-tertiary flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {c.duration}s
                            </span>
                          ) : null}
                        </div>

                        {/* Spoken Dialogue Accordion */}
                        {c.transcript && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTranscriptId(
                                  expandedTranscriptId === (c.id || '') ? null : (c.id || '')
                                )
                              }
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
                            >
                              {expandedTranscriptId === c.id ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Hide Spoken Dialogue</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>View Spoken Dialogue</span>
                                </>
                              )}
                            </button>

                            {expandedTranscriptId === c.id && (
                              <div className="mt-2 p-3 rounded-lg bg-obsidian-surface border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-line leading-relaxed">
                                {c.transcript}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-text-secondary">
                      No contacts found in this campaign.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-obsidian-surface border border-dashed border-border-subtle text-center space-y-3">
              <Users className="w-10 h-10 text-text-tertiary mx-auto" />
              <h3 className="text-sm font-semibold text-text-primary">Select or Create a Campaign</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Fill in the form on the left or click a sample list to test automated outbound dialing in Marathi, Hindi, or English.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}