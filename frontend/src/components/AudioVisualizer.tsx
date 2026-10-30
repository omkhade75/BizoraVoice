'use client';

import React, { useEffect, useRef } from 'react';
import { CallState } from '@/hooks/useWebSocket';

interface AudioVisualizerProps {
  userLevel: number;
  assistantLevel: number;
  state: CallState;
  isMuted?: boolean;
}

export function AudioVisualizer({
  userLevel,
  assistantLevel,
  state,
  isMuted = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 36;
      const barWidth = 4;
      const gap = 5;
      const totalWidth = numBars * (barWidth + gap);
      const startX = (canvas.width - totalWidth) / 2;
      const centerY = canvas.height / 2;

      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening' && !isMuted;
      const isThinking = state === 'thinking';

      const amplitude = isSpeaking
        ? Math.max(0.18, assistantLevel)
        : isListening
        ? Math.max(0.12, userLevel)
        : isThinking
        ? 0.3
        : 0.05;

      for (let i = 0; i < numBars; i++) {
        const x = startX + i * (barWidth + gap);
        let height: number;

        if (isThinking) {
          // Smooth sine ripples in amber
          height = Math.sin(phase + i * 0.28) * 16 + 22;
        } else {
          const centerDist = Math.abs(i - numBars / 2) / (numBars / 2);
          const factor = 1 - centerDist * 0.55;
          const noise = Math.sin(phase * 1.8 + i * 0.75) * 0.35 + 0.65;
          height = Math.max(5, amplitude * 72 * factor * noise);
        }

        // Palette strictly: Emerald (#10b981), Amber (#f59e0b), or Zinc (#52525b) - NO BLUE!
        if (isSpeaking) {
          ctx.fillStyle = '#10b981'; // Emerald 500
        } else if (isListening) {
          ctx.fillStyle = '#f59e0b'; // Amber 500
        } else if (isThinking) {
          ctx.fillStyle = '#fbbf24'; // Warm Amber 400
        } else {
          ctx.fillStyle = '#3f3f46'; // Zinc 700
        }

        ctx.beginPath();
        ctx.roundRect(x, centerY - height / 2, barWidth, height, 2.5);
        ctx.fill();
      }

      phase += 0.07;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [userLevel, assistantLevel, state, isMuted]);

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <canvas
        ref={canvasRef}
        width={380}
        height={90}
        className="w-full max-w-sm rounded-xl bg-zinc-950/80 border border-zinc-800/60 shadow-inner"
      />
    </div>
  );
}
