'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface UseWebSocketOptions {
  onAudioReceived?: (data: ArrayBuffer) => void;
  onTranscript?: (role: 'user' | 'assistant', text: string, isFinal: boolean) => void;
  onStateChange?: (state: CallState) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function useWebSocket({
  onAudioReceived,
  onTranscript,
  onStateChange,
  onError,
  onClose,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((sessionId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
    const cleanHost = wsHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
    const wsUrl = `${wsProtocol}//${cleanHost}/ws/call/${sessionId}`;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('BizVoice WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Audio chunk from TTS
          if (onAudioReceived) {
            onAudioReceived(event.data);
          }
        } else if (typeof event.data === 'string') {
          // JSON control or transcript event
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
              if (onTranscript) {
                onTranscript(data.role, data.text, data.is_final ?? true);
              }
            } else if (data.type === 'state') {
              if (onStateChange) {
                onStateChange(data.state as CallState);
              }
            } else if (data.type === 'error') {
              if (onError) {
                onError(data.message || 'An error occurred on the server.');
              }
            }
          } catch (err) {
            console.error('Failed to parse WebSocket JSON message:', err);
          }
        }
      };

      ws.onerror = (event) => {
        console.error('BizVoice WebSocket error:', event);
        if (onError) onError('WebSocket connection failed.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        if (onClose) onClose();
      };
    } catch (err: unknown) {
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : 'Failed to connect WebSocket';
      if (onError) onError(msg);
    }
  }, [onAudioReceived, onTranscript, onStateChange, onError, onClose]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Send graceful call termination command
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'end' }));
        }
      } catch {}
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendAudio = useCallback((buffer: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(buffer);
    }
  }, []);

  const sendJson = useCallback((data: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const toggleMute = useCallback((muted: boolean) => {
    sendJson({ type: 'mute', value: muted });
  }, [sendJson]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendAudio,
    sendJson,
    toggleMute,
  };
}
