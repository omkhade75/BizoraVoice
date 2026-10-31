'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Terminal,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { getApiKeys, createApiKey, deleteApiKey, ApiKey } from '@/lib/api';

type CodeTab = 'curl' | 'python' | 'node' | 'ws';

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch {
      // fallback mock key
      setKeys([
        {
          id: '1',
          name: 'Vaani Production App',
          key_prefix: 'bv_live_demo9988',
          created_at: new Date().toISOString(),
          calls_count: 142,
        },
      ]);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || loading) return;
    setLoading(true);
    try {
      const created = await createApiKey(newKeyName.trim());
      setRevealedKey(created.full_key || created.key_prefix);
      setNewKeyName('');
      loadKeys();
    } catch (err: any) {
      alert(`Error creating key: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will be disconnected.')) return;
    try {
      await deleteApiKey(id);
      loadKeys();
    } catch (err: any) {
      alert(`Error deleting key: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const selectedKeyPrefix = revealedKey || keys[0]?.key_prefix || 'bv_live_demo998877665544332211';

  const CODE_SNIPPETS: Record<CodeTab, string> = {
    curl: `curl -X POST http://localhost:8000/api/calls/start \\
  -H "Authorization: Bearer ${selectedKeyPrefix}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "marathi-supplier-agent",
    "client_type": "telephony",
    "language": "mr"
  }'`,

    python: `import requests

API_KEY = "${selectedKeyPrefix}"
BASE_URL = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "agent_id": "marathi-supplier-agent",
    "client_type": "python-sdk",
    "language": "mr"
}

response = requests.post(f"{BASE_URL}/api/calls/start", json=payload, headers=headers)
print("Call Session:", response.json())`,

    node: `import fetch from 'node-fetch';

const API_KEY = '${selectedKeyPrefix}';
const BASE_URL = 'http://localhost:8000';

async function startVoiceCall() {
  const res = await fetch(\`\${BASE_URL}/api/calls/start\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: 'marathi-supplier-agent',
      client_type: 'node-client',
      language: 'mr'
    })
  });
  
  const session = await res.json();
  console.log('Live session created:', session);
}

startVoiceCall();`,

    ws: `// Real-Time Audio Streaming via WebSocket
const socket = new WebSocket('ws://localhost:8000/ws/call/live');

socket.onopen = () => {
  // Send Handshake with your Vaani API Key
  socket.send(JSON.stringify({
    type: 'init',
    agent_id: 'marathi-supplier-agent',
    api_key: '${selectedKeyPrefix}',
    sample_rate: 24000
  }));
};

socket.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const msg = JSON.parse(event.data);
    console.log('Event:', msg.type, msg.content || msg.state);
  } else {
    // Binary raw 24kHz PCM16 audio bytes from Vaani Engine
    playRawPcmChunk(event.data);
  }
};`
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
            VAPI COMPATIBLE
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
            ZERO CLOUD TOKENS
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-emerald-400" />
          Developer API & Key Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Issue scoped API keys to control Vaani Voice programmatically from your backend, mobile app, or AI assistant.
        </p>
      </div>

      {/* Secret Key Alert when created */}
      {revealedKey && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              New API Key Generated! Copy it now:
            </span>
            <button
              onClick={() => copyToClipboard(revealedKey, 'key')}
              className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-100 font-mono"
            >
              {copiedKey === revealedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === revealedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs text-emerald-400 break-all select-all">
            {revealedKey}
          </div>
          <p className="text-[11px] text-amber-400/80">
            For security, full secret keys are only shown once. Keep it safe in your `.env` file.
          </p>
        </div>
      )}

      {/* API Key Creation & Table */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Active API Keys
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Use these keys with `Authorization: Bearer bv_live_...`</p>
          </div>

          <form onSubmit={handleCreateKey} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Bizora AI Mobile App"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newKeyName.trim() || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Key</span>
            </button>
          </form>
        </div>

        <div className="divide-y divide-zinc-800">
          {keys.map((k) => (
            <div key={k.id} className="p-4 px-5 flex items-center justify-between hover:bg-zinc-800/40 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-200 flex items-center gap-2">
                  <span>{k.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {k.key_prefix}...
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Created {new Date(k.created_at).toLocaleDateString()} • {k.calls_count} calls handled
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(k.key_prefix, 'key')}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                  title="Copy Key Prefix"
                >
                  {copiedKey === k.key_prefix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  title="Revoke Key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Integration Playground */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 px-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Integration Code Snippets</h2>
          </div>
          <button
            onClick={() => copyToClipboard(CODE_SNIPPETS[activeTab], 'code')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 pt-2 gap-2 text-xs font-mono">
          {(['curl', 'python', 'node', 'ws'] as CodeTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-t-lg transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-zinc-900 text-emerald-400 border-t border-x border-zinc-800 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python SDK' : tab === 'node' ? 'Node.js' : 'WebSocket Streaming'}
            </button>
          ))}
        </div>

        <div className="p-4 bg-zinc-950 overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed">
          <pre>{CODE_SNIPPETS[activeTab]}</pre>
        </div>
      </div>

      {/* Vapi vs Vaani Voice Comparison Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          Why Vaani Voice Replaces Vapi AI for Good
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 font-medium">Feature</th>
                <th className="py-2 font-medium text-amber-400">Vaani Voice (Self-Hosted)</th>
                <th className="py-2 font-medium text-zinc-500">Vapi.ai (Cloud SaaS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-2.5 font-medium">Cost Per Minute</td>
                <td className="py-2.5 text-emerald-400 font-mono font-semibold">₹0.00 / $0.00 (Free)</td>
                <td className="py-2.5 text-zinc-500 font-mono">\$0.07 - \$0.15 / min (~₹6 - ₹12/min)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Indic & Asian Voices</td>
                <td className="py-2.5 text-emerald-400">Native Marathi, Hindi, Gujarati, Tamil</td>
                <td className="py-2.5 text-zinc-500">Limited / Requires 11Labs keys (\$30+/mo)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Third-Party API Keys</td>
                <td className="py-2.5 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> None (Zero external dependencies)
                </td>
                <td className="py-2.5 text-zinc-500">Requires OpenAI, Deepgram, Twilio keys</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Data Privacy & Sovereignty</td>
                <td className="py-2.5 text-emerald-400">100% on your local machine / server</td>
                <td className="py-2.5 text-zinc-500">Transcripts pass through US cloud servers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
