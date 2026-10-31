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
  const [twilioError, setTwilioError] = useState<string | null>(null);
  const [twilioSuccessMsg, setTwilioSuccessMsg] = useState<string | null>(null);
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
    if (typeof window !== 'undefined') {
      const savedSid = localStorage.getItem('bizora_twilio_sid');
      if (savedSid) setTwilioSid(savedSid);
    }
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

  const handleQueryTwilio = async (useDemo: boolean = false) => {
    setTwilioError(null);
    setTwilioSuccessMsg(null);

    let sid = twilioSid.trim();
    let token = twilioToken.trim();

    if (useDemo) {
      sid = 'demo_sandbox_account';
      token = 'demo_sandbox_token';
      setTwilioSid(sid);
      setTwilioToken(token);
    } else {
      if (!sid || !token) {
        setTwilioError('Please enter both Twilio Account SID (e.g. AC...) and Auth Token from your Twilio Console.');
        return;
      }
      if (!sid.startsWith('AC') && !sid.startsWith('demo')) {
        setTwilioError('Invalid Account SID format. Twilio Account SIDs always begin with "AC".');
        return;
      }
    }

    setIsQueryingTwilio(true);
    try {
      if (typeof window !== 'undefined' && !useDemo) {
        localStorage.setItem('bizora_twilio_sid', sid);
      }
      const results = await queryTwilioNumbers(sid, token);
      setAvailableTwilioNumbers(results);
      if (results.length === 0) {
        setTwilioSuccessMsg('Twilio authentication succeeded, but 0 phone numbers were found in this account.');
      } else {
        setTwilioSuccessMsg(`Successfully authenticated with Twilio! Found ${results.length} incoming phone number(s).`);
      }
    } catch (err: any) {
      setAvailableTwilioNumbers([]);
      setTwilioError(err.message || 'Twilio connection failed. Please verify your Account SID and Auth Token.');
    } finally {
      setIsQueryingTwilio(false);
    }
  };

  const handleImportSingle = async (num: TwilioAvailableNumber) => {
    setIsImporting(true);
    try {
      await importTwilioNumbers({
        account_sid: twilioSid.trim(),
        auth_token: twilioToken.trim(),
        agent_id: selectedAgentForImport || undefined,
        auto_configure_webhook: true,
        numbers: [
          {
            phone_number: num.phone_number,
            friendly_name: num.friendly_name,
            provider_sid: num.provider_sid,
          },
        ],
      });

      // Update local state
      setAvailableTwilioNumbers((prev) =>
        prev.map((n) => (n.phone_number === num.phone_number ? { ...n, already_imported: true } : n))
      );
      await loadData();
      setActiveTab('directory');
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddGsmNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gsmPhone.trim()) return;
    setIsAddingGsm(true);
    try {
      await registerCustomNumber({
        phone_number: gsmPhone.trim(),
        friendly_name: gsmFriendly.trim() || 'Indian 4G VoLTE Gateway',
        provider: 'gsm_gateway',
        agent_id: gsmAgentId || undefined,
      });
      await loadData();
      setActiveTab('directory');
    } catch (err: any) {
      alert(`Failed to add GSM SIM: ${err.message}`);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Twilio BYOT + 4G GSM
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase">
              0% Vapi Platform Tax
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Hash className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Phone Numbers & Carrier Telephony
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Import real phone numbers from your Twilio console with live API credentials, or register physical Indian 4G VoLTE GSM SIMs (Jio/Airtel ₹299/mo) for unlimited calling.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Active Numbers ({phoneNumbers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('twilio_import')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'twilio_import'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Import Twilio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gsm_gateway')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'gsm_gateway'
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
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
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Twilio Cloud Numbers</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Direct Twilio REST API + Media Stream Webhooks. Pay raw carrier cost ($0.01/m).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('twilio_import')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
              >
                + Import
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center font-bold">
                  <Signal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">4G VoLTE GSM Gateways</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Physical SIM card (Jio / Airtel ₹299/mo). 100% free unlimited Indian calling.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('gsm_gateway')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm"
              >
                + Add SIM
              </button>
            </div>
          </div>

          {/* Numbers Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Registered Inbound & Outbound Lines
              </span>
              <button
                type="button"
                onClick={loadData}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs text-zinc-500">Loading telephony numbers...</div>
            ) : phoneNumbers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Phone Numbers Registered Yet</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Connect your Twilio account to query and import your live numbers, or connect your Jio 4G GSM SIM.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('twilio_import')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                  >
                    Import Twilio Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gsm_gateway')}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition hover:bg-zinc-50"
                  >
                    Add 4G GSM SIM
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {phoneNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          num.provider === 'twilio'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {num.provider === 'twilio' ? <Globe className="w-5 h-5" /> : <Signal className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {num.phone_number}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              num.provider === 'twilio'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {num.provider === 'twilio' ? 'Twilio BYOT' : '4G VoLTE GSM'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {num.friendly_name || 'Inbound Direct Line'}
                        </div>
                      </div>
                    </div>

                    {/* Assigned AI Agent Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
                        <select
                          value={num.agent_id || ''}
                          onChange={(e) => handleAgentChange(num.id, e.target.value)}
                          className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition"
                          title="Copy Twilio Voice Webhook URL"
                        >
                          {copiedId === num.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copied</span>
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
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition"
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
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900/90 border border-emerald-500/30 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Import Real Twilio Phone Numbers (BYOT)
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Live API integration: Enter your Twilio credentials to query active incoming numbers and auto-bind webhooks.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                0% VAPI PLATFORM TAX
              </span>
            </div>

            {/* Error / Success Feedback Banners */}
            {twilioError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Twilio Error:</strong> {twilioError}
                </div>
              </div>
            )}

            {twilioSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{twilioSuccessMsg}</span>
              </div>
            )}

            {/* Credential Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Twilio Account SID:
                </label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Twilio Auth Token:
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Credentials stay on your server. Never forwarded to any intermediary.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQueryTwilio(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Test import flow with realistic demo credentials"
                >
                  Explore Demo Numbers
                </button>

                <button
                  type="button"
                  onClick={() => handleQueryTwilio(false)}
                  disabled={isQueryingTwilio}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md"
                >
                  {isQueryingTwilio ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Twilio REST API...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Query My Twilio Numbers</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Available Numbers Result List */}
          {availableTwilioNumbers.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-md space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Twilio Phone Numbers Found ({availableTwilioNumbers.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Assign to Agent:</span>
                  <select
                    value={selectedAgentForImport}
                    onChange={(e) => setSelectedAgentForImport(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {availableTwilioNumbers.map((num) => (
                  <div
                    key={num.phone_number}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {num.phone_number}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                          {num.provider_sid}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{num.friendly_name}</p>
                    </div>

                    <div>
                      {num.already_imported ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Imported & Live</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImportSingle(num)}
                          disabled={isImporting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Import & Auto-Bind Webhook</span>
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

      {/* TAB 3: 4G VOLTE GSM GATEWAY */}
      {activeTab === 'gsm_gateway' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900/90 border border-amber-500/30 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Signal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Connect 4G VoLTE GSM Gateway (Jio / Airtel Unlimited SIM)
                </h2>
                <p className="text-xs text-zinc-500">
                  Plug any standard ₹299/month physical Indian SIM card into a hardware GSM gateway (e.g. GoIP, Dinstar) or SIP PBX.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddGsmNumber} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Indian Mobile Number (with +91):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919820011223"
                    value={gsmPhone}
                    onChange={(e) => setGsmPhone(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Label / Description:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nashik APMC Desk SIM"
                    value={gsmFriendly}
                    onChange={(e) => setGsmFriendly(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Route Incoming Calls to AI Voice Agent:
                </label>
                <select
                  value={gsmAgentId}
                  onChange={(e) => setGsmAgentId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.language.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isAddingGsm}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-md"
                >
                  {isAddingGsm ? 'Registering SIM...' : 'Register 4G VoLTE Gateway Line'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
