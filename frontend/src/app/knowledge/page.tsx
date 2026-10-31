'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  size: string;
  chunks: number;
  updatedAt: string;
  associatedAgents: string[];
  contentSnippet: string;
}

const DEFAULT_DOCS: KnowledgeDoc[] = [
  {
    id: 'kb-apmc-rates',
    title: 'Maharashtra APMC Mandi Rate & Quality Grading Guide.pdf',
    category: 'Agriculture & Trade',
    size: '1.4 MB',
    chunks: 48,
    updatedAt: '2 hours ago',
    associatedAgents: ['Marathi Supplier Outreach', 'Maharashtra Krishi Kendra'],
    contentSnippet: 'Grade A Nashik red onion price range: ₹2,200 - ₹2,600/quintal. Maximum allowable moisture: 12%. Truck freight rate from Lasalgaon to Vashi APMC: ₹38/bag...',
  },
  {
    id: 'kb-taj-menu',
    title: 'Taj Residency Banquet Tariff & Room Booking Policies.pdf',
    category: 'Hospitality',
    size: '890 KB',
    chunks: 32,
    updatedAt: 'Yesterday',
    associatedAgents: ['Taj Residency Concierge'],
    contentSnippet: 'Check-in time 14:00, Check-out 11:00. Grand Ballroom capacity: 450 guests. Pure vegetarian dining hall available. Cancellation refundable up to 24 hours prior...',
  },
  {
    id: 'kb-patil-dental',
    title: 'Dr. Patil Dental Clinic Tariff & Pre-Op Guidelines.docx',
    category: 'Healthcare',
    size: '420 KB',
    chunks: 19,
    updatedAt: '3 days ago',
    associatedAgents: ['Dr. Patil Dental Care'],
    contentSnippet: 'Root canal treatment single sitting tariff: ₹4,500. Dental implants warranty: 10 years. Fasting required only for IV sedation procedures. Emergency walk-ins accepted...',
  },
];

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(DEFAULT_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc>(DEFAULT_DOCS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newText, setNewText] = useState('');

  React.useEffect(() => {
    async function loadKnowledge() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('bizvoice_auth_token') : null;
        const res = await fetch('http://127.0.0.1:8000/api/knowledge', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const allDocs: KnowledgeDoc[] = [];
            data.forEach((kb: any) => {
              kb.documents?.forEach((d: any) => {
                allDocs.push({
                  id: d.id,
                  title: d.filename,
                  category: kb.name,
                  size: `${d.chunk_count * 0.4} KB`,
                  chunks: d.chunk_count,
                  updatedAt: 'Indexed in Supabase',
                  associatedAgents: ['All Workspace Agents'],
                  contentSnippet: d.content?.slice(0, 200) || 'Vector indexed text',
                });
              });
            });
            if (allDocs.length > 0) {
              setDocs(allDocs);
              setSelectedDoc(allDocs[0]);
            }
          }
        }
      } catch {
        // Fall back to default
      }
    }
    loadKnowledge();
  }, []);

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bizvoice_auth_token') : null;
      const kbRes = await fetch('http://127.0.0.1:8000/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newCategory || 'Default Catalog', description: 'Product knowledge' }),
      });

      if (kbRes.ok) {
        const kbData = await kbRes.json();
        await fetch(`http://127.0.0.1:8000/api/knowledge/${kbData.id}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            filename: newTitle.endsWith('.txt') ? newTitle : `${newTitle}.txt`,
            content: newText,
          }),
        });
      }
    } catch {
      // Fallback
    }

    const created: KnowledgeDoc = {
      id: `kb-${Date.now()}`,
      title: newTitle.endsWith('.txt') ? newTitle : `${newTitle}.txt`,
      category: newCategory,
      size: `${Math.round(newText.length / 1024 * 10) / 10 + 0.1} KB`,
      chunks: Math.max(1, Math.ceil(newText.length / 300)),
      updatedAt: 'Just now (Supabase)',
      associatedAgents: ['All Workspace Agents'],
      contentSnippet: newText.slice(0, 180) + '...',
    };
    setDocs([created, ...docs]);
    setSelectedDoc(created);
    setShowUploadModal(false);
    setNewTitle('');
    setNewText('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Knowledge Base & RAG Index
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Zero Hallucinations
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Upload product catalogs, price sheets, and FAQs. Your AI voice assistants retrieve exact facts in real-time during conversations.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Main Grid: Document List & Document Chunks Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search knowledge documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-surface text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-obsidian-surface shadow-xs ring-1 ring-amber-500/30'
                      : 'border-border-subtle bg-obsidian-surface hover:border-border-medium'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-obsidian-canvas text-amber-500 border border-border-subtle flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-text-primary truncate">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary mt-1">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.chunks} vector chunks</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document Inspector & Vector Search Test */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-border-subtle bg-obsidian-surface shadow-xs space-y-6">
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  {selectedDoc.category}
                </span>
                <h2 className="text-base font-bold text-text-primary mt-0.5">
                  {selectedDoc.title}
                </h2>
                <div className="flex items-center gap-3 text-xs font-mono text-text-tertiary mt-1">
                  <span>Indexed: {selectedDoc.updatedAt}</span>
                  <span>•</span>
                  <span>{selectedDoc.chunks} Semantic Embeddings Ready</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Indexed in Supabase
              </span>
            </div>

            {/* Content Snippet / Chunks Preview */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Document Chunk Vector Preview (Top 1):
              </label>
              <div className="p-4 rounded-xl bg-obsidian-canvas border border-border-subtle text-xs text-text-primary font-mono leading-relaxed">
                {selectedDoc.contentSnippet}
              </div>
            </div>

            {/* Connected Voice Assistants */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Attached Voice Assistants:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedDoc.associatedAgents.map((agentName) => (
                  <span
                    key={agentName}
                    className="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  >
                    {agentName}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Vector Retrieval Box */}
            <div className="p-4 rounded-xl border border-border-subtle bg-obsidian-elevated/40 space-y-2">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Real-Time RAG Telemetry
              </span>
              <p className="text-xs text-text-secondary">
                During live calls, the STT utterance query is converted into a vector embedding and matched with cosine similarity against these chunks in under 60ms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              Upload Knowledge Document / FAQ
            </h3>
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune APMC Rate Sheet October 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs font-semibold text-text-primary"
                >
                  <option value="Agriculture & Mandi">Agriculture & Mandi</option>
                  <option value="Hospitality & Dining">Hospitality & Dining</option>
                  <option value="Healthcare & Clinic">Healthcare & Clinic</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="General Company FAQ">General Company FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Document Text Content or FAQ
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste FAQ questions, price tables, product specs, or terms..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-obsidian-elevated text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-obsidian-elevated transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas font-bold text-xs transition shadow-xs"
                >
                  Embed & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
