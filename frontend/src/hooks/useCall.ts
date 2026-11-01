'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudio } from './useAudio';
import { useWebSocket, CallState } from './useWebSocket';
import { generateSessionId } from '@/lib/utils';
import { getAuthToken, API_BASE } from '@/lib/api';

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
  const recognitionRef = useRef<any>(null);
  const callStateRef = useRef<CallState>('idle');
  const lastUserUtteranceRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const handleAudioReceived = useCallback((data: ArrayBuffer) => {
    audio.playPcmChunk(data);
  }, []);

  const handleTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setTranscript((prev) => {
      // Deduplicate: discard exact duplicate role and message received within 3000ms
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const isSame = last.role === role && last.text.trim().toLowerCase() === cleanText.toLowerCase();
        const isRecent = Date.now() - last.timestamp.getTime() < 3000;
        if (isSame && isRecent) {
          return prev;
        }
      }

      return [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          role,
          text: cleanText,
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  const handleStateChange = useCallback((state: CallState) => {
    setCallState(state);
    callStateRef.current = state;
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

  const startSpeechRecognition = useCallback((lang: string = 'mr') => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;

      const langMap: Record<string, string> = {
        mr: 'mr-IN',
        hi: 'hi-IN',
        gu: 'gu-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        en: 'en-IN',
      };
      recognition.lang = langMap[lang.toLowerCase()] || 'en-IN';

      recognition.onresult = (event: any) => {
        // Discard speech recognition when AI is already processing or speaking
        if (callStateRef.current === 'speaking' || callStateRef.current === 'thinking') {
          return;
        }

        // Process only finalized results to avoid interim repeats
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res.isFinal) {
            const text = res[0]?.transcript?.trim();
            if (!text) continue;

            const now = Date.now();
            // Debounce: ignore duplicate identical phrase within 2500ms
            if (
              lastUserUtteranceRef.current.text.toLowerCase() === text.toLowerCase() &&
              now - lastUserUtteranceRef.current.time < 2500
            ) {
              continue;
            }

            lastUserUtteranceRef.current = { text, time: now };
            console.log('SpeechRecognition captured verified final utterance:', text);

            // Record transcript once and trigger AI thinking state
            handleTranscript('user', text);
            setCallState('thinking');
            callStateRef.current = 'thinking';

            ws.sendJson({ type: 'user_utterance', text });
            break;
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition notice:', e.error);
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition could not initialize:', e);
    }
  }, [handleTranscript, ws]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.stop();
      } catch {}
    }
  }, []);

  const startCall = useCallback(async (
    agentId?: string,
    agentLang?: string,
    customPrompt?: string,
    voice?: string,
    greeting?: string,
    model?: string,
    inferenceMode?: 'gemini' | 'ollama'
  ) => {
    try {
      setError(null);
      setTranscript([]);
      setDuration(0);

      const token = getAuthToken();
      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('bizora_gemini_key') || undefined : undefined;
      const localInferenceMode = (typeof window !== 'undefined' ? localStorage.getItem('bizora_inference_mode') : null) || 'gemini';
      const effectiveMode = inferenceMode || (localInferenceMode as 'gemini' | 'ollama');
      const localModel = typeof window !== 'undefined' ? localStorage.getItem('bizora_selected_model') || undefined : undefined;
      const effectiveModel = model || localModel || (effectiveMode === 'gemini' ? 'gemini-2.5-flash' : 'qwen3.5:4b');

      const startRes = await fetch(`${API_BASE}/api/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agent_id: agentId || null,
          model: effectiveModel,
          inference_mode: effectiveMode,
          custom_system_prompt: customPrompt || null,
          voice: voice || null,
          greeting_message: greeting || null,
          gemini_api_key: localGeminiKey,
        }),
      });

      let sessionId = generateSessionId();
      if (startRes.ok) {
        const data = await startRes.json();
        if (data.session_id) sessionId = data.session_id;
      }

      // Connect WebSocket & start mic
      ws.connect(sessionId);
      await audio.startCapture();
      startSpeechRecognition(agentLang);

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
  }, [ws, audio, startSpeechRecognition]);

  const transferAgent = useCallback((
    agentName: string,
    voice: string,
    systemPrompt?: string,
    transferPhrase?: string
  ) => {
    if (ws.isConnected) {
      ws.sendJson({
        type: 'transfer',
        agent_name: agentName,
        voice,
        system_prompt: systemPrompt,
        transfer_phrase: transferPhrase || `Transferring you to ${agentName}.`,
      });
    }
  }, [ws]);

  const endCall = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    stopSpeechRecognition();
    audio.stopCapture();
    audio.stopPlayback();
    ws.disconnect();

    setIsInCall(false);
    setCallState('idle');
    setUserLevel(0);
    setAssistantLevel(0);
  }, [audio, ws, stopSpeechRecognition]);

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
    transferAgent,
    sendJson: ws.sendJson,
  };
}
