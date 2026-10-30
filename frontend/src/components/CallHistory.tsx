'use client';

import React, { useState } from 'react';
import { Call, getCall } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';
import { Clock, MessageSquare, X, CheckCircle2, Bot, User, IndianRupee } from 'lucide-react';

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
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Agent Persona</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Cloud Bill Saved</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No calls recorded yet. Start a test call to see session logs here!
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 font-medium text-zinc-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span>{call.agent_name || 'Bizora Assistant'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono">
                      {formatDate(call.started_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {formatDuration(call.duration)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                      ₹{((call.duration / 60) * 5.8).toFixed(1)} (\$
                      {((call.duration / 60) * 0.07).toFixed(2)})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewTranscript(call.id)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-emerald-400 font-medium px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-zinc-950 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-800 max-h-[80vh] flex flex-col text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">
                  Call with {selectedCall.agent_name || 'Agent'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {formatDate(selectedCall.started_at)} • Duration: {formatDuration(selectedCall.duration)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(!selectedCall.transcript || selectedCall.transcript.length === 0) ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No transcript entries recorded for this session.
                </div>
              ) : (
                selectedCall.transcript.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span
                          className={`block text-[10px] mt-1 text-right font-mono ${
                            isUser ? 'text-emerald-200' : 'text-zinc-500'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
