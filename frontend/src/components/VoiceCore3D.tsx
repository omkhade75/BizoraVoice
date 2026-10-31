'use client';

import React, { useEffect, useRef, useState } from 'react';

export type VoiceCoreState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceCore3DProps {
  state?: VoiceCoreState;
  audioLevel?: number; // 0.0 to 1.0 (amplitude)
  size?: number; // Canvas size in pixels (default 280)
  interactive?: boolean;
  onStateClick?: () => void;
  className?: string;
  label?: string;
}

export function VoiceCore3D({
  state = 'idle',
  audioLevel = 0,
  size = 280,
  interactive = true,
  onStateClick,
  className = '',
  label,
}: VoiceCore3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    const center = size / 2;
    const baseRadius = size * 0.28;

    // Particle field
    const particles = Array.from({ length: 32 }, (_, i) => ({
      angle: (i / 32) * Math.PI * 2,
      distance: baseRadius * (0.6 + Math.random() * 0.8),
      speed: 0.01 + Math.random() * 0.015,
      size: 1 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Animation speed & color based on state
      let speed = 0.02;
      let primaryColor = { r: 230, g: 154, b: 72 }; // Warm Amber (#E69A48)
      let secondaryColor = { r: 243, g: 184, b: 102 }; // Light Amber (#F3B866)
      let pulseMod = Math.sin(time * 2) * 0.05;

      if (state === 'listening') {
        speed = 0.035;
        pulseMod = (audioLevel > 0 ? audioLevel : 0.3) * 0.25;
        primaryColor = { r: 56, g: 189, b: 248 }; // Cyan/Azure
        secondaryColor = { r: 125, g: 211, b: 252 };
      } else if (state === 'processing') {
        speed = 0.065;
        pulseMod = Math.sin(time * 6) * 0.08;
        primaryColor = { r: 168, g: 85, b: 247 }; // Neural Purple
        secondaryColor = { r: 216, g: 180, b: 254 };
      } else if (state === 'speaking') {
        speed = 0.045;
        const wave = Math.sin(time * 4) * 0.15;
        pulseMod = (audioLevel > 0 ? audioLevel * 0.3 : 0.2) + wave;
        primaryColor = { r: 34, g: 197, b: 94 }; // Phosphor Emerald
        secondaryColor = { r: 134, g: 239, b: 172 };
      } else if (state === 'error') {
        speed = 0.08;
        pulseMod = Math.sin(time * 12) * 0.1;
        primaryColor = { r: 239, g: 68, b: 68 }; // Coral Red
        secondaryColor = { r: 252, g: 165, b: 165 };
      }

      time += speed;

      // 1. Central Acoustic Glow Backdrop
      const glowGrad = ctx.createRadialGradient(
        center,
        center,
        baseRadius * 0.2,
        center,
        center,
        baseRadius * 1.6
      );
      glowGrad.addColorStop(
        0,
        `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${state === 'idle' ? 0.22 : 0.35})`
      );
      glowGrad.addColorStop(
        0.5,
        `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.08)`
      );
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Multi-Layer 3D Orbiting Rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringTiltX = 0.65 + r * 0.15;
        const ringRotation = time * (r % 2 === 0 ? 1 : -1.2) + (r * Math.PI) / ringCount;
        const radius = baseRadius * (1 + pulseMod + r * 0.22);

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(ringRotation);
        ctx.scale(1, ringTiltX);

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${0.35 - r * 0.08})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        // High-frequency harmonic nodes on rings
        const nodeAngle = time * 2.5 + r * 1.5;
        const nx = Math.cos(nodeAngle) * radius;
        const ny = Math.sin(nodeAngle) * radius;

        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.9)`;
        ctx.shadowColor = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // 3. Central Tactile Nucleus Sphere
      const nucleusRadius = baseRadius * (0.45 + pulseMod * 0.5);
      const nucleusGrad = ctx.createRadialGradient(
        center - nucleusRadius * 0.3,
        center - nucleusRadius * 0.3,
        2,
        center,
        center,
        nucleusRadius
      );
      nucleusGrad.addColorStop(0, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.95)`);
      nucleusGrad.addColorStop(0.7, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.85)`);
      nucleusGrad.addColorStop(1, `rgba(${Math.floor(primaryColor.r * 0.4)}, ${Math.floor(primaryColor.g * 0.4)}, ${Math.floor(primaryColor.b * 0.4)}, 0.4)`);

      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, nucleusRadius, 0, Math.PI * 2);
      ctx.fillStyle = nucleusGrad;
      ctx.shadowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.6)`;
      ctx.shadowBlur = isHovered ? 24 : 14;
      ctx.fill();
      ctx.restore();

      // 4. Acoustic Wave Particles
      particles.forEach((p, idx) => {
        p.angle += p.speed * (state === 'processing' ? 2.5 : 1);
        let dist = p.distance + Math.sin(time * 3 + p.phase) * (baseRadius * 0.15);

        if (state === 'processing') {
          // Inward gravitational pull
          dist = baseRadius * (0.3 + 0.5 * Math.sin(time * 2 + idx));
        } else if (state === 'speaking') {
          // Outward acoustic expansion
          dist = baseRadius * (0.5 + 0.8 * ((time * 0.5 + idx * 0.1) % 1));
        }

        const px = center + Math.cos(p.angle) * dist;
        const py = center + Math.sin(p.angle) * dist * 0.7; // slight isometric foreshortening

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        const alpha = Math.max(0.1, 0.7 - (dist / (baseRadius * 1.5)) * 0.6);
        ctx.fillStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, ${alpha})`;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, audioLevel, size, isHovered]);

  const getStatePill = () => {
    switch (state) {
      case 'listening':
        return { text: 'LISTENING', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
      case 'processing':
        return { text: 'THINKING', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'speaking':
        return { text: 'SPEAKING', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'error':
        return { text: 'INTERRUPTED', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'idle':
      default:
        return { text: 'READY', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    }
  };

  const pill = getStatePill();

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={interactive ? onStateClick : undefined}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className={`transition-transform duration-300 ${
          interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
      />

      {/* Floating State Badge Overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] font-mono tracking-wider transition-all duration-200">
        <span className={`w-1.5 h-1.5 rounded-full animate-ping ${state === 'idle' ? 'bg-amber-400' : state === 'speaking' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
        <span className={`font-semibold ${pill.bg.split(' ')[1]}`}>
          {label || pill.text}
        </span>
      </div>
    </div>
  );
}
