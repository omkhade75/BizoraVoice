'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudio } from './useAudio';
import { useWebSocket, CallState } from './useWebSocket';
import { generateSessionId } from '@/lib/utils';
import { getAuthToken } from '@/lib/api';

export interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function useCall() {
  const [isInCall, setIsInCall] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [userLevel, setUserLevel] = useState(0);
  const [assistantLevel, setAssistantLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAudioReceived = useCallback((data: ArrayBuffer) => {
    audio.playPcmChunk(data);
  }, []);

  const handleTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role,
        text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleStateChange = useCallback((state: CallState) => {
    setCallState(state);
    if (state === 'listening') {
      audio.stopPlayback();
    }
  }, []);

  const ws = useWebSocket({
    onAudioReceived: handleAudioReceived,
    onTranscript: handleTranscript,
    onStateChange: handleStateChange,
    onError: (err) => setError(err),
    onClose: () => {
      endCall();
    },
  });

  const audio = useAudio({
    onAudioData: (pcmBuffer) => {
      if (!isMuted && ws.isConnected) {
        ws.sendAudio(pcmBuffer);
      }
    },
    onUserLevel: (level) => {
      if (!isMuted) setUserLevel(level);
    },
    onAssistantLevel: (level) => {
      setAssistantLevel(level);
    },
  });

  const startCall = useCallback(async (agentId?: string) => {
    try {
      setError(null);
      setTranscript([]);
      setDuration(0);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = getAuthToken();

      const startRes = await fetch(`${API_BASE}/api/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agent_id: agentId || null }),
      });

      let sessionId = generateSessionId();
      if (startRes.ok) {
        const data = await startRes.json();
        if (data.session_id) sessionId = data.session_id;
      }

      // Connect WebSocket & start mic
      ws.connect(sessionId);
      await audio.startCapture();

      setIsInCall(true);
      setCallState('listening');

      // Start duration counter
      durationTimerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start call';
      setError(msg);
      endCall();
    }
  }, [ws, audio]);

  const endCall = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    audio.stopCapture();
    audio.stopPlayback();
    ws.disconnect();

    setIsInCall(false);
    setCallState('idle');
    setUserLevel(0);
    setAssistantLevel(0);
  }, [audio, ws]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      ws.toggleMute(next);
      return next;
    });
  }, [ws]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);

  return {
    isInCall,
    callState,
    isMuted,
    userLevel,
    assistantLevel,
    transcript,
    duration,
    error,
    startCall,
    endCall,
    toggleMute,
  };
}
