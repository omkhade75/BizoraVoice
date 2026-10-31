'use client';

import React, { useState } from 'react';
import { Call, getCall } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';
import { Clock, MessageSquare, X, CheckCircle2, Bot, User } from 'lucide-react';

interface CallHistoryProps {
  calls: Call[];
}

export function CallHistory({ calls }: CallHistoryProps) {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const handleViewTranscript = async (callId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getCall(callId);
      setSelectedCall(detail);
    } catch (err) {
      console.error('Failed to load call detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <>
      <div className="bg-obsidian-surface rounded-2xl border border-border-subtle overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian-elevated border-b border-border-subtle text-text-tertiary uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Agent Persona</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Cloud Bill Saved</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-secondary">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-tertiary font-mono">
                    No calls recorded yet. Start a test call to see session logs here!
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-obsidian-elevated/40 transition">
                    <td className="py-3.5 px-4 font-medium text-text-primary flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-obsidian-canvas border border-border-subtle flex items-center justify-center text-amber-500">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span>{call.agent_name || 'Bizora Assistant'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary font-mono">
                      {formatDate(call.started_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-primary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                        {formatDuration(call.duration)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-500 font-bold">
                      ₹{((call.duration / 60) * 5.8).toFixed(1)} (\$
                      {((call.duration / 60) * 0.07).toFixed(2)})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewTranscript(call.id)}
                        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-amber-500 font-semibold px-2.5 py-1 rounded-lg bg-obsidian-elevated hover:bg-obsidian-hover border border-border-subtle transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Transcript
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-obsidian-surface rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border-subtle max-h-[80vh] flex flex-col text-text-primary">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <h3 className="font-bold text-sm text-text-primary">Call Session Transcript</h3>
                <div className="flex items-center gap-2 text-[11px] font-mono text-text-tertiary mt-0.5">
                  <span>{formatDate(selectedCall.started_at)}</span>
                  <span>•</span>
                  <span>{formatDuration(selectedCall.duration)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-obsidian-elevated transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 text-xs">
              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                selectedCall.transcript.map((item, idx) => {
                  const isUser = item.role === 'user';
                  return (
                    <div key={idx} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2 leading-relaxed ${
                          isUser
                            ? 'bg-amber-500 text-obsidian-canvas font-medium'
                            : 'bg-obsidian-elevated text-text-primary border border-border-subtle'
                        }`}
                      >
                        <p>{item.content || (item as any).text || ''}</p>
                      </div>
                      {isUser && (
                        <div className="w-6 h-6 rounded-lg bg-obsidian-elevated text-text-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-text-tertiary font-mono">
                  No dialog turns recorded in this session.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
