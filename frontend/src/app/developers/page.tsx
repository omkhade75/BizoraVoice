'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Zap,
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
      setKeys([
        {
          id: '1',
          name: 'Bizora Production App',
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

    ws: `// Real-Time Audio Streaming via WebSocket (329ms)
const socket = new WebSocket('ws://localhost:8000/ws/call/live');

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'init',
    agent_id: 'marathi-supplier-agent',
    api_key: '${selectedKeyPrefix}',
    sample_rate: 16000
  }));
};

socket.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const msg = JSON.parse(event.data);
    console.log('Event:', msg.type, msg.content || msg.state);
  } else {
    // Binary raw 16kHz PCM audio bytes from BizoraVoice Engine
    playRawPcmChunk(event.data);
  }
};`
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono">
            VAPI COMPATIBLE
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-border-subtle text-text-secondary border border-border-subtle text-[10px] font-mono">
            ZERO CLOUD TOKENS
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <Code2 className="w-6 h-6 text-amber-500" />
          Developer API & Key Management
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Issue scoped API keys to control BizoraVoice programmatically from your backend, mobile app, or AI assistant.
        </p>
      </div>

      {/* Secret Key Alert when created */}
      {revealedKey && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-amber-400" />
              New API Key Generated! Copy it now:
            </span>
            <button
              onClick={() => copyToClipboard(revealedKey, 'key')}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              {copiedKey === revealedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === revealedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
          <div className="p-2.5 bg-obsidian-canvas rounded-lg border border-border-subtle font-mono text-xs text-emerald-500 break-all select-all">
            {revealedKey}
          </div>
          <p className="text-[11px] text-text-tertiary">
            For security, full secret keys are only shown once. Keep it safe in your `.env` file.
          </p>
        </div>
      )}

      {/* API Key Creation & Table */}
      <div className="bg-obsidian-surface rounded-2xl border border-border-subtle overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Active API Keys
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">Use these keys with `Authorization: Bearer bv_live_...`</p>
          </div>

          <form onSubmit={handleCreateKey} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Bizora Production App"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-obsidian-elevated border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!newKeyName.trim() || loading}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-canvas text-xs font-bold disabled:opacity-40 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Key</span>
            </button>
          </form>
        </div>

        <div className="divide-y divide-border-subtle">
          {keys.map((k) => (
            <div key={k.id} className="p-4 px-5 flex items-center justify-between hover:bg-obsidian-elevated/40 text-xs font-mono">
              <div className="space-y-1">
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  <span>{k.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-obsidian-elevated text-text-tertiary">
                    {k.calls_count} calls
                  </span>
                </div>
                <div className="text-text-tertiary flex items-center gap-2">
                  <span>{k.key_prefix}...</span>
                  <button
                    onClick={() => copyToClipboard(k.key_prefix, 'key')}
                    className="text-text-tertiary hover:text-amber-500"
                    title="Copy Key Prefix"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDeleteKey(k.id)}
                className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Revoke Key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Code Snippets Panel */}
      <div className="bg-obsidian-surface rounded-2xl border border-border-subtle overflow-hidden shadow-xs space-y-4">
        <div className="flex items-center justify-between px-5 pt-4 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            {(['curl', 'python', 'node', 'ws'] as CodeTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                  activeTab === tab
                    ? 'bg-amber-500 text-obsidian-canvas shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => copyToClipboard(CODE_SNIPPETS[activeTab], 'code')}
            className="flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-amber-500 transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>

        <pre className="p-5 text-xs font-mono text-text-secondary overflow-x-auto leading-relaxed">
          <code>{CODE_SNIPPETS[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
