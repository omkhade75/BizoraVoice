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
  const sizeMap = {
    sm: { box: 'w-7 h-7', iconSize: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', iconSize: 36, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 'w-11 h-11', iconSize: 44, text: 'text-lg', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Acoustic Instrument Mark */}
      <div
        className={`relative ${currentSize.box} rounded-xl bg-obsidian-surface dark:bg-[#141612] border border-border-subtle dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 group-hover:border-amber-500/40`}
      >
        <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(230,154,72,0.15)_0%,transparent_70%)] pointer-events-none" />

        <svg
          width={currentSize.iconSize * 0.65}
          height={currentSize.iconSize * 0.65}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="sonicAmberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F3B866" />
              <stop offset="100%" stopColor="#E69A48" />
            </linearGradient>
          </defs>

          {/* Bar 1 */}
          <rect
            x="3"
            y="9"
            width="2.5"
            height="10"
            rx="1.25"
            fill="#E69A48"
            fillOpacity="0.4"
            className={animated ? 'animate-[pulse_2.2s_ease-in-out_infinite]' : ''}
          />

          {/* Bar 2 */}
          <rect
            x="8"
            y="5"
            width="2.6"
            height="18"
            rx="1.3"
            fill="#E69A48"
            fillOpacity="0.75"
            className={animated ? 'animate-[pulse_1.8s_ease-in-out_infinite_0.3s]' : ''}
          />

          {/* Bar 3 (Apex Vocal Core) */}
          <rect
            x="13"
            y="2"
            width="2.8"
            height="24"
            rx="1.4"
            fill="url(#sonicAmberGrad)"
            className={animated ? 'animate-[pulse_1.5s_ease-in-out_infinite_0.1s]' : ''}
          />

          {/* Bar 4 */}
          <rect
            x="18.2"
            y="6.5"
            width="2.6"
            height="15"
            rx="1.3"
            fill="#E69A48"
            fillOpacity="0.8"
            className={animated ? 'animate-[pulse_2s_ease-in-out_infinite_0.5s]' : ''}
          />

          {/* Bar 5 */}
          <rect
            x="23"
            y="11"
            width="2.5"
            height="6"
            rx="1.25"
            fill="#E69A48"
            fillOpacity="0.4"
            className={animated ? 'animate-[pulse_2.4s_ease-in-out_infinite_0.2s]' : ''}
          />

          {/* Active Carrier Phosphor Dot */}
          <circle cx="23" cy="5" r="1.5" fill="#22C55E" />
        </svg>
      </div>

      {/* Brand Typographic Identity */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-text-primary tracking-tight ${currentSize.text}`}>
              Bizora
            </span>
            <span className={`font-semibold text-amber-500 dark:text-[#E69A48] tracking-tight ${currentSize.text}`}>
              Voice
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              v2.4
            </span>
          </div>
          <p className={`${currentSize.sub} text-text-tertiary font-mono tracking-tight flex items-center gap-1.5 mt-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Developer Voice Infrastructure</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
