'use client';

import React, { useState, useEffect } from 'react';
import {
  Hash,
  Phone,
  Radio,
  Plus,
  RefreshCw,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Globe,
  Signal,
  ArrowRight,
  ExternalLink,
  Bot,
} from 'lucide-react';
import {
  PhoneNumber,
  TwilioAvailableNumber,
  Agent,
  getPhoneNumbers,
  queryTwilioNumbers,
  importTwilioNumbers,
  registerCustomNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  getAgents,
} from '@/lib/api';

export default function PhoneNumbersPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'twilio_import' | 'gsm_gateway'>('directory');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Twilio Import Form State
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [availableTwilioNumbers, setAvailableTwilioNumbers] = useState<TwilioAvailableNumber[]>([]);
  const [isQueryingTwilio, setIsQueryingTwilio] = useState(false);
  const [selectedAgentForImport, setSelectedAgentForImport] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // GSM Gateway Form State
  const [gsmPhone, setGsmPhone] = useState('+919820098765');
  const [gsmFriendly, setGsmFriendly] = useState('Mumbai Jio 4G SIM (₹299/mo)');
  const [gsmAgentId, setGsmAgentId] = useState('');
  const [isAddingGsm, setIsAddingGsm] = useState(false);

  // Copied Webhook URL state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nums, aList] = await Promise.all([
        getPhoneNumbers().catch(() => []),
        getAgents().catch(() => []),
      ]);
      setPhoneNumbers(nums);
      setAgents(aList);
      if (aList.length > 0) {
        setSelectedAgentForImport(aList[0].id);
        setGsmAgentId(aList[0].id);
      }
    } catch (err) {
      console.error('Error loading telephony data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryTwilio = async () => {
    setIsQueryingTwilio(true);
    try {
      // Use provided keys or fallback simulation key for demonstration
      const sid = twilioSid.trim() || 'AC_prod_demo_account';
      const token = twilioToken.trim() || 'auth_token_demo';
      const results = await queryTwilioNumbers(sid, token);
      setAvailableTwilioNumbers(results);
    } catch (err: any) {
      alert(`Error querying Twilio API: ${err.message}`);
    } finally {
      setIsQueryingTwilio(false);
    }
  };

  const handleImportSingle = async (num: TwilioAvailableNumber) => {
    setIsImporting(true);
    try {
      await importTwilioNumbers({
        account_sid: twilioSid.trim() || undefined,
        auth_token: twilioToken.trim() || undefined,
        numbers: [
          {
            phone_number: num.phone_number,
            friendly_name: num.friendly_name,
            provider_sid: num.provider_sid,
          },
        ],
        agent_id: selectedAgentForImport || undefined,
        auto_configure_webhook: true,
      });
      alert(`Phone number ${num.phone_number} successfully imported into Bizora Voice!`);
      await loadData();
      // Mark as imported in local state
      setAvailableTwilioNumbers((prev) =>
        prev.map((n) => (n.phone_number === num.phone_number ? { ...n, already_imported: true } : n))
      );
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRegisterGsm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gsmPhone.trim()) return;
    setIsAddingGsm(true);
    try {
      await registerCustomNumber({
        phone_number: gsmPhone.trim(),
        friendly_name: gsmFriendly.trim() || gsmPhone.trim(),
        provider: 'gsm_gateway',
        agent_id: gsmAgentId || undefined,
      });
      alert(`4G GSM SIM (${gsmPhone}) registered successfully!`);
      await loadData();
      setActiveTab('directory');
    } catch (err: any) {
      alert(`Error registering GSM number: ${err.message}`);
    } finally {
      setIsAddingGsm(false);
    }
  };

  const handleAgentChange = async (numberId: string, newAgentId: string) => {
    try {
      const updated = await updatePhoneNumber(numberId, { agent_id: newAgentId });
      setPhoneNumbers((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err: any) {
      alert(`Failed to update assigned agent: ${err.message}`);
    }
  };

  const handleDeleteNumber = async (numberId: string) => {
    if (!confirm('Remove this phone number from Bizora Voice?')) return;
    try {
      await deletePhoneNumber(numberId);
      setPhoneNumbers((prev) => prev.filter((n) => n.id !== numberId));
    } catch (err: any) {
      alert(`Failed to delete number: ${err.message}`);
    }
  };

  const copyWebhook = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide uppercase">
              Dual Telephony Engine
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold tracking-wide uppercase">
              Twilio BYOT + 4G GSM SIM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-3">
            <Hash className="w-7 h-7 text-emerald-400" />
            Phone Numbers & Carrier Telephony
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Both systems available side-by-side: Import your existing{' '}
            <strong className="text-zinc-200">Twilio Phone Numbers (BYOT)</strong> with 1-click webhook binding,
            or connect a <strong className="text-zinc-200">4G VoLTE GSM Gateway (Jio/Airtel ₹299/mo SIM)</strong> for
            100% free unlimited Indian calling.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'directory'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active Numbers ({phoneNumbers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('twilio_import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'twilio_import'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Import Twilio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gsm_gateway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'gsm_gateway'
                ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Signal className="w-3.5 h-3.5" />
            <span>4G GSM SIM</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE NUMBERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Twilio Cloud Numbers</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Global numbers, toll-free, and US/UK landlines. 0% Vapi platform fee.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('twilio_import')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
              >
                + Import More
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center font-bold">
                  <Signal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">4G VoLTE GSM Gateways</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Local Indian mobile SIMs (Jio/Airtel). Flat ₹299/mo, zero OTP lock.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('gsm_gateway')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                + Add SIM
              </button>
            </div>
          </div>

          {/* Table of Active Numbers */}
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-100">
                  Registered Telephony Endpoints ({phoneNumbers.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Incoming calls to these numbers are answered immediately by the assigned AI receptionist.
                </p>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs text-zinc-500">Loading numbers...</div>
            ) : phoneNumbers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="font-bold text-sm text-zinc-200">No Phone Numbers Registered Yet</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connect your Twilio account to import numbers in 1 click, or register your Jio 4G GSM SIM.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('twilio_import')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
                  >
                    Import Twilio Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gsm_gateway')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
                  >
                    Add 4G GSM SIM
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {phoneNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-850/50 transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          num.provider === 'twilio'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {num.provider === 'twilio' ? <Globe className="w-5 h-5" /> : <Signal className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-100">
                            {num.phone_number}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              num.provider === 'twilio'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {num.provider === 'twilio' ? 'Twilio BYOT' : '4G VoLTE GSM'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {num.friendly_name || 'Inbound Direct Line'}
                        </div>
                      </div>
                    </div>

                    {/* Assigned AI Agent Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                        <select
                          value={num.agent_id || ''}
                          onChange={(e) => handleAgentChange(num.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Unassigned (Fallback)</option>
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name} ({ag.language.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Webhook Copy */}
                      {num.webhook_url && (
                        <button
                          type="button"
                          onClick={() => copyWebhook(num.webhook_url!, num.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition"
                          title="Copy Twilio Voice Webhook URL"
                        >
                          {copiedId === num.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Webhook</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteNumber(num.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Remove Number"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT TWILIO NUMBERS (BYOT) */}
      {activeTab === 'twilio_import' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    Import Existing Twilio Phone Numbers (BYOT)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Enter your Twilio credentials. Bizora Voice fetches your numbers and binds webhooks automatically.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                0% VAPI PLATFORM TAX
              </span>
            </div>

            {/* Credential Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Twilio Account SID:
                </label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Twilio Auth Token:
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Credentials stay on your local server. Never sent to any 3rd party cloud.</span>
              </div>

              <button
                type="button"
                onClick={handleQueryTwilio}
                disabled={isQueryingTwilio}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40"
              >
                {isQueryingTwilio ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Twilio...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Fetch My Twilio Numbers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Available Numbers Result List */}
          {availableTwilioNumbers.length > 0 && (
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-zinc-100">
                  Twilio Phone Numbers Found ({availableTwilioNumbers.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Assign to Agent:</span>
                  <select
                    value={selectedAgentForImport}
                    onChange={(e) => setSelectedAgentForImport(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y divide-zinc-800/80">
                {availableTwilioNumbers.map((num) => (
                  <div
                    key={num.phone_number}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-100">
                          {num.phone_number}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-950">
                          {num.provider_sid}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{num.friendly_name}</p>
                    </div>

                    <div>
                      {num.already_imported ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Imported & Live</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImportSingle(num)}
                          disabled={isImporting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import & Connect Webhook</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 4G VoLTE GSM GATEWAY (Jio/Airtel SIM) */}
      {activeTab === 'gsm_gateway' && (
        <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/90 border border-amber-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Signal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  4G VoLTE GSM Gateway SIM (Indian Telephony)
                </h2>
                <p className="text-xs text-zinc-400">
                  Connect any standard Jio or Airtel SIM card inserted into a GoIP or Dinstar GSM Gateway box.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              ₹299/MO UNLIMITED CALLS • ZERO OTP LOCKS
            </span>
          </div>

          <form onSubmit={handleRegisterGsm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  SIM Phone Number:
                </label>
                <input
                  type="text"
                  placeholder="+919820011223"
                  value={gsmPhone}
                  onChange={(e) => setGsmPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Friendly Label:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jio 4G Mandi SIM"
                  value={gsmFriendly}
                  onChange={(e) => setGsmFriendly(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Assigned AI Receptionist:
                </label>
                <select
                  value={gsmAgentId}
                  onChange={(e) => setGsmAgentId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.language.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-200">How it works:</div>
              <p>
                In India, calling mobile numbers from Twilio trial accounts requires OTP pre-verification.
                By connecting a standard ₹299/month Jio/Airtel 4G SIM into a local GSM Gateway, you can call
                any customer mobile number in India with zero OTP restrictions, and the recipient sees your actual
                Indian mobile caller ID.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isAddingGsm}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-950/40"
              >
                <Signal className="w-4 h-4" />
                <span>Register 4G GSM SIM</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
