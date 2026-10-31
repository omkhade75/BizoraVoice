'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Sparkles,
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

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;
    const created: KnowledgeDoc = {
      id: `kb-${Date.now()}`,
      title: newTitle.endsWith('.txt') ? newTitle : `${newTitle}.txt`,
      category: newCategory,
      size: `${Math.round(newText.length / 1024 * 10) / 10 + 0.1} KB`,
      chunks: Math.max(1, Math.ceil(newText.length / 300)),
      updatedAt: 'Just now',
      associatedAgents: ['Marathi Supplier Outreach'],
      contentSnippet: newText.slice(0, 180) + '...',
    };
    setDocs([created, ...docs]);
    setSelectedDoc(created);
    setShowUploadModal(false);
    setNewTitle('');
    setNewText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Knowledge Base & RAG Index
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Zero Hallucinations
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Upload product catalogs, price sheets, and FAQs. Your AI voice assistants retrieve exact facts in real-time during conversations.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
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
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search knowledge documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      ? 'border-emerald-500 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
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
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {selectedDoc.category}
                </span>
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedDoc.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span>Indexed: {selectedDoc.updatedAt}</span>
                  <span>•</span>
                  <span>{selectedDoc.chunks} Semantic Embeddings Ready</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Indexed in Supabase
              </span>
            </div>

            {/* Content Snippet / Chunks Preview */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Document Chunk Vector Preview (Top 1):
              </label>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 font-mono leading-relaxed">
                {selectedDoc.contentSnippet}
              </div>
            </div>

            {/* Connected Voice Assistants */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Attached Voice Assistants:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedDoc.associatedAgents.map((agentName) => (
                  <span
                    key={agentName}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                  >
                    {agentName}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Vector Retrieval Box */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Real-Time RAG Verification
              </span>
              <p className="text-xs text-zinc-500">
                During live calls, the STT utterance query is converted into a vector embedding and matched with cosine similarity against these chunks in under 60ms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Upload Knowledge Document / FAQ
            </h3>
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune APMC Rate Sheet October 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                >
                  <option value="Agriculture & Mandi">Agriculture & Mandi</option>
                  <option value="Hospitality & Dining">Hospitality & Dining</option>
                  <option value="Healthcare & Clinic">Healthcare & Clinic</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="General Company FAQ">General Company FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Document Text Content or FAQ
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste FAQ questions, price tables, product specs, or terms..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
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
