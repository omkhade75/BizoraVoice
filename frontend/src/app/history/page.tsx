'use client';

import React, { useEffect, useState } from 'react';
import { getCalls, Call } from '@/lib/api';
import { CallHistory } from '@/components/CallHistory';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCalls()
      .then((data) => setCalls(data))
      .catch((err) => console.error('Failed to load calls:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono font-bold">
            AUDIT LOGS
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-border-subtle text-text-secondary border border-border-subtle text-[10px] font-mono font-bold">
            SUPABASE POSTGRESQL ARCHIVED
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <History className="w-6 h-6 text-amber-500" />
          Call History & Dialogue Transcripts
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Review recorded call durations, cloud cost savings ($ and ₹), timestamps, and dual-language conversational transcripts.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-text-tertiary">
          Loading call history from Supabase...
        </div>
      ) : (
        <CallHistory calls={calls} />
      )}
    </div>
  );
}
