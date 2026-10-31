'use client';

import React from 'react';

interface CopilotLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function CopilotLogo({
  size = 'md',
  className = '',
  animated = true,
}: CopilotLogoProps) {
  const sizeMap = {
    sm: { box: 'w-6 h-6', px: 24, strokeWidth: 1.5 },
    md: { box: 'w-8 h-8', px: 32, strokeWidth: 1.75 },
    lg: { box: 'w-10 h-10', px: 40, strokeWidth: 2 },
  };

  const current = sizeMap[size];

  return (
    <div
      className={`relative ${current.box} rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 group-hover:border-amber-500/60 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] ${className}`}
      title="Bizora Voice Copilot AI"
    >
      {/* Ambient Radial Core Shimmer */}
      <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2)_0%,transparent_70%)] pointer-events-none" />

      <svg
        width={current.px * 0.72}
        height={current.px * 0.72}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${animated ? 'transition-transform duration-300 group-hover:scale-105' : ''}`}
      >
        <defs>
          <linearGradient id="copilotAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="copilotWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <filter id="copilotGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Acoustic Telephony Wave Arcs (Left & Right) */}
        <path
          d="M 6.5 11.5 C 4.5 14.2, 4.5 17.8, 6.5 20.5"
          stroke="url(#copilotWaveGrad)"
          strokeWidth={current.strokeWidth}
          strokeLinecap="round"
          strokeOpacity="0.45"
          className={animated ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''}
        />
        <path
          d="M 25.5 11.5 C 27.5 14.2, 27.5 17.8, 25.5 20.5"
          stroke="url(#copilotWaveGrad)"
          strokeWidth={current.strokeWidth}
          strokeLinecap="round"
          strokeOpacity="0.45"
          className={animated ? 'animate-[pulse_2.4s_ease-in-out_infinite_0.4s]' : ''}
        />

        {/* Primary Duplex Voice Harmonics (Inner Arcs) */}
        <path
          d="M 10.5 8.5 C 8 12.2, 8 19.8, 10.5 23.5"
          stroke="url(#copilotAmberGrad)"
          strokeWidth={current.strokeWidth}
          strokeLinecap="round"
          className={animated ? 'animate-[pulse_1.8s_ease-in-out_infinite_0.2s]' : ''}
        />
        <path
          d="M 21.5 8.5 C 24 12.2, 24 19.8, 21.5 23.5"
          stroke="url(#copilotAmberGrad)"
          strokeWidth={current.strokeWidth}
          strokeLinecap="round"
          className={animated ? 'animate-[pulse_1.8s_ease-in-out_infinite_0.2s]' : ''}
        />

        {/* Top & Bottom Micro Telephony Node Orbitals */}
        <circle cx="16" cy="5.5" r="1.25" fill="#FBBF24" fillOpacity="0.85" />
        <circle cx="16" cy="26.5" r="1.25" fill="#F59E0B" fillOpacity="0.85" />

        {/* Central Intelligent Acoustic Vocal Core */}
        <circle
          cx="16"
          cy="16"
          r="4.2"
          fill="url(#copilotAmberGrad)"
          filter="url(#copilotGlow)"
        />

        {/* Inner Precision Sparkle Nexus (Intelligence Signature) */}
        <path
          d="M 16 13.2 V 18.8 M 13.2 16 H 18.8"
          stroke="#191B17"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="1.1" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
