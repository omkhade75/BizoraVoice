'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  animated = true,
  className = '',
}: BrandLogoProps) {
  // Dimensions for icon container
  const sizeMap = {
    sm: { box: 'w-7 h-7', iconSize: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', iconSize: 40, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 'w-12 h-12', iconSize: 48, text: 'text-lg', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Acoustic Logo Mark */}
      <div
        className={`relative ${currentSize.box} rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40 group-hover:border-emerald-500/50 group-hover:scale-105 transition-all duration-300`}
      >
        {/* Subtle inner emerald radial glow */}
        <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18)_0%,transparent_70%)] pointer-events-none" />

        <svg
          width={currentSize.iconSize * 0.7}
          height={currentSize.iconSize * 0.7}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="vaaniEmeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="vaaniAmberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Bar 1 (Left Outer) */}
          <rect
            x="2"
            y="9"
            width="2.5"
            height="10"
            rx="1.25"
            fill="#10b981"
            fillOpacity="0.45"
            className={animated ? 'animate-[pulse_2.2s_ease-in-out_infinite]' : ''}
          />

          {/* Bar 2 (Left Mid) */}
          <rect
            x="7"
            y="5.5"
            width="2.6"
            height="17"
            rx="1.3"
            fill="#10b981"
            fillOpacity="0.75"
            className={animated ? 'animate-[pulse_1.8s_ease-in-out_infinite_0.3s]' : ''}
          />

          {/* Bar 3 (Center Apex - Vocal Core) */}
          <rect
            x="12.2"
            y="2.5"
            width="2.8"
            height="23"
            rx="1.4"
            fill="url(#vaaniEmeraldGrad)"
            className={animated ? 'animate-[pulse_1.5s_ease-in-out_infinite_0.1s]' : ''}
          />

          {/* Bar 4 (Right Mid) */}
          <rect
            x="17.6"
            y="7"
            width="2.6"
            height="14"
            rx="1.3"
            fill="#10b981"
            fillOpacity="0.85"
            className={animated ? 'animate-[pulse_2s_ease-in-out_infinite_0.5s]' : ''}
          />

          {/* Bar 5 (Right Outer Telephony Channel) */}
          <rect
            x="23"
            y="11"
            width="2.5"
            height="7"
            rx="1.25"
            fill="url(#vaaniAmberGrad)"
            className={animated ? 'animate-[pulse_2.4s_ease-in-out_infinite_0.2s]' : ''}
          />

          {/* Live Telemetry Ping Dot */}
          <circle cx="24.25" cy="6" r="1.25" fill="#f59e0b" />
        </svg>
      </div>

      {/* Brand Typographic Identity */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-zinc-100 ${currentSize.text} tracking-tight`}>
              Vaani
            </span>
            <span className={`font-medium text-emerald-400 ${currentSize.text} tracking-tight`}>
              Voice
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ml-0.5">
              AI
            </span>
          </div>
          <p className={`${currentSize.sub} text-zinc-400 font-medium flex items-center gap-1.5 leading-tight mt-0.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sovereign Voice Telephony</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
