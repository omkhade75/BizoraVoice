'use client';

import React, { useState, useEffect } from 'react';
import {
  Hash,
  Phone,
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

  const handleQueryTwilio = async () => {
    setTwilioError(null);
    setTwilioSuccessMsg(null);

    const sid = twilioSid.trim();
    const token = twilioToken.trim();

    if (!sid || !token) {
      setTwilioError('Please enter both Twilio Account SID (e.g. AC...) and Auth Token from your Twilio Console.');
      return;
    }

    setIsQueryingTwilio(true);
    try {
      const result = await queryTwilioNumbers(sid, token);
      setAvailableTwilioNumbers(result || []);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bizora_twilio_sid', sid);
      }
      if (result && result.length > 0) {
        setTwilioSuccessMsg(`Found ${result.length} incoming phone number(s) in your Twilio account.`);
      } else {
        setTwilioSuccessMsg('Twilio authenticated successfully, but no active incoming phone numbers were found in this account.');
      }
    } catch (err: any) {
      setTwilioError(err.message || 'Failed to connect to Twilio. Check your credentials.');
    } finally {
      setIsQueryingTwilio(false);
    }
  };

  const handleImportNumber = async (num: TwilioAvailableNumber) => {
    setIsImporting(true);
    try {
      await importTwilioNumbers({
        account_sid: twilioSid.trim(),
        auth_token: twilioToken.trim(),
        numbers: [
          {
            phone_number: num.phone_number,
            friendly_name: num.friendly_name || num.phone_number,
            provider_sid: num.provider_sid,
          },
        ],
        agent_id: selectedAgentForImport || undefined,
      });
      await loadData();
      setActiveTab('directory');
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddGsmSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingGsm(true);
    try {
      await registerCustomNumber({
        phone_number: gsmPhone.trim(),
        friendly_name: gsmFriendly.trim(),
        agent_id: gsmAgentId || undefined,
        provider: 'gsm_gateway',
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
    if (!confirm('Remove this phone number from BizoraVoice?')) return;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">
              Twilio BYOT + 4G GSM
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-border-subtle text-text-secondary border border-border-subtle font-bold uppercase">
              0% Vapi Platform Markup
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Hash className="w-6 h-6 text-amber-500" />
            Phone Numbers & Telephony Carriers
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Import real phone numbers from your Twilio console with live API credentials, or register physical Indian 4G VoLTE GSM SIMs (Jio/Airtel ₹299/mo) for unlimited calling.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-obsidian-surface border border-border-subtle shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'directory'
                ? 'bg-obsidian-elevated text-amber-500 border border-border-subtle shadow-xs font-bold'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            Active Numbers ({phoneNumbers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('twilio_import')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'twilio_import'
                ? 'bg-obsidian-elevated text-amber-500 border border-border-subtle shadow-xs font-bold'
                : 'text-text-tertiary hover:text-text-primary'
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
                ? 'bg-obsidian-elevated text-amber-500 border border-border-subtle shadow-xs font-bold'
                : 'text-text-tertiary hover:text-text-primary'
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
            <div className="p-5 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-obsidian-canvas text-amber-500 border border-border-subtle flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Twilio BYOT Lines</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Direct Twilio REST API + Media Stream Webhooks. Pay raw carrier cost (\$0.01/m).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('twilio_import')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
              >
                + Import
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-obsidian-canvas text-emerald-500 border border-border-subtle flex items-center justify-center font-bold">
                  <Signal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">4G VoLTE GSM Gateways</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Physical SIM card (Jio / Airtel ₹299/mo). 100% free unlimited Indian calling.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('gsm_gateway')}
                className="px-3 py-1.5 rounded-lg bg-obsidian-elevated hover:bg-obsidian-hover text-text-primary border border-border-subtle font-semibold text-xs transition"
              >
                + Add SIM
              </button>
            </div>
          </div>

          {/* Numbers Table */}
          <div className="rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary">
                Registered Inbound & Outbound Lines
              </span>
              <button
                type="button"
                onClick={loadData}
                className="p-1.5 rounded-lg border border-border-subtle text-text-tertiary hover:text-text-primary transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs font-mono text-text-tertiary">
                Loading telephony numbers from Supabase...
              </div>
            ) : phoneNumbers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-obsidian-elevated text-text-tertiary mx-auto flex items-center justify-center">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="font-semibold text-sm text-text-primary">No Phone Numbers Registered Yet</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Connect your Twilio account to query and import your live numbers, or connect your Jio 4G GSM SIM.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('twilio_import')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
                  >
                    Import Twilio Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gsm_gateway')}
                    className="px-4 py-2 rounded-xl border border-border-subtle bg-obsidian-elevated text-text-primary font-semibold text-xs transition hover:bg-obsidian-hover"
                  >
                    Add 4G GSM SIM
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {phoneNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-obsidian-elevated/40 transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          num.provider === 'twilio'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}
                      >
                        {num.provider === 'twilio' ? <Globe className="w-5 h-5" /> : <Signal className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-text-primary">
                            {num.phone_number}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              num.provider === 'twilio'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {num.provider === 'twilio' ? 'Twilio BYOT' : '4G VoLTE GSM'}
                          </span>
                        </div>
                        <div className="text-xs text-text-tertiary mt-0.5">
                          {num.friendly_name || 'Inbound Direct Line'}
                        </div>
                      </div>
                    </div>

                    {/* Assigned AI Agent Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                        <select
                          value={num.agent_id || ''}
                          onChange={(e) => handleAgentChange(num.id, e.target.value)}
                          className="bg-obsidian-elevated border border-border-subtle text-text-primary text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary text-xs transition"
                          title="Copy Twilio Voice Webhook URL"
                        >
                          {copiedId === num.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="font-mono text-[11px]">{copiedId === num.id ? 'Copied URL' : 'Copy Webhook'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteNumber(num.id)}
                        className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete Number"
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

      {/* TAB 2: TWILIO BYOT IMPORT */}
      {activeTab === 'twilio_import' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-obsidian-surface border border-border-subtle space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-text-primary">Connect Twilio Account (BYOT)</h3>
                <p className="text-xs text-text-tertiary">
                  Enter your Account SID & Auth Token from console.twilio.com to query and import your phone numbers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Twilio Account SID (starts with AC...)
                </label>
                <input
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Twilio Auth Token
                </label>
                <input
                  type="password"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {twilioError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{twilioError}</span>
              </div>
            )}

            {twilioSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{twilioSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleQueryTwilio}
                disabled={isQueryingTwilio}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-obsidian-canvas font-bold text-xs transition shadow-xs flex items-center gap-2"
              >
                {isQueryingTwilio ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>{isQueryingTwilio ? 'Connecting to Twilio...' : 'Query Live Numbers'}</span>
              </button>
            </div>
          </div>

          {/* Results List */}
          {availableTwilioNumbers.length > 0 && (
            <div className="p-6 rounded-2xl bg-obsidian-surface border border-border-subtle space-y-4">
              <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider font-mono">
                Available Twilio Numbers to Import:
              </h4>

              <div className="divide-y divide-border-subtle border border-border-subtle rounded-xl overflow-hidden">
                {availableTwilioNumbers.map((num) => (
                  <div key={num.provider_sid || num.phone_number} className="p-4 flex items-center justify-between hover:bg-obsidian-elevated/40">
                    <div>
                      <div className="font-mono font-bold text-sm text-text-primary">{num.phone_number}</div>
                      <div className="text-xs text-text-tertiary">{num.friendly_name || 'Standard Inbound Voice'}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportNumber(num)}
                      disabled={isImporting}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
                    >
                      Import to Studio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 4G GSM GATEWAY */}
      {activeTab === 'gsm_gateway' && (
        <form onSubmit={handleAddGsmSim} className="p-6 rounded-2xl bg-obsidian-surface border border-border-subtle space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Signal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-primary">Register Physical 4G GSM SIM (Jio / Airtel)</h3>
              <p className="text-xs text-text-tertiary">
                Connect your on-premise USB 4G dongle or GSM VoIP gateway. Enables unlimited domestic calls at ₹299/mo with zero per-minute cloud fees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Phone Number (E.164)
              </label>
              <input
                type="text"
                required
                value={gsmPhone}
                onChange={(e) => setGsmPhone(e.target.value)}
                placeholder="+919820011223"
                className="w-full px-3.5 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Friendly Label
              </label>
              <input
                type="text"
                value={gsmFriendly}
                onChange={(e) => setGsmFriendly(e.target.value)}
                placeholder="Mumbai Jio 4G SIM"
                className="w-full px-3.5 py-2 bg-obsidian-elevated border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAddingGsm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              {isAddingGsm ? 'Registering...' : 'Register 4G GSM Line'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
