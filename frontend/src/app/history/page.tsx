'use client';

import React, { useEffect, useState } from 'react';
import { getCalls, Call } from '@/lib/api';
import { CallHistory } from '@/components/CallHistory';
import { History, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
            AUDIT LOGS
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
            LOCAL STORAGE
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-400" />
          Call History & Transcripts
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review recorded call durations, cloud cost savings ($ and ₹), timestamps, and dual-language conversational transcripts.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">Loading call history...</div>
      ) : (
        <CallHistory calls={calls} />
      )}
    </div>
  );
}
