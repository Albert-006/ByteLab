/**
 * ByteLab Custom Silicon Microchip Logo
 * Represents the 8-bit BL-8 processor architecture with perimeter pins,
 * glowing circuit die, and stylized "B" / "8" core mark.
 */

import React from 'react';

export interface ByteLabLogoProps {
  size?: number;
  className?: string;
}

export const ByteLabLogo: React.FC<ByteLabLogoProps> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      data-testid="bytelab-logo"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="blChipBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="blNeonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="blGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main Microchip Body */}
      <rect
        x="8"
        y="8"
        width="48"
        height="48"
        rx="10"
        fill="url(#blChipBg)"
        stroke="url(#blNeonGlow)"
        strokeWidth="2"
      />

      {/* 8 Architectural External Pins */}
      {/* Top Pins */}
      <line x1="22" y1="3" x2="22" y2="8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="3" x2="42" y2="8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bottom Pins */}
      <line x1="22" y1="56" x2="22" y2="61" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="56" x2="42" y2="61" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left Pins */}
      <line x1="3" y1="22" x2="8" y2="22" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="3" y1="42" x2="8" y2="42" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right Pins */}
      <line x1="56" y1="22" x2="61" y2="22" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="56" y1="42" x2="61" y2="42" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Central Silicon Die */}
      <rect
        x="18"
        y="18"
        width="28"
        height="28"
        rx="6"
        fill="#1e1b4b"
        stroke="#38bdf8"
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Stylized Silicon "B" / "8" Core Glyph */}
      <path
        d="M 26 23 L 36 23 C 39.5 23 41.5 25 41.5 28 C 41.5 30 40 31.5 38 32 C 40.5 32.5 42.5 34.5 42.5 37.5 C 42.5 41 39.5 43 36 43 L 26 43 Z"
        fill="none"
        stroke="url(#blNeonGlow)"
        strokeWidth="2.8"
        strokeLinejoin="round"
        filter="url(#blGlow)"
      />

      <line
        x1="26"
        y1="32.5"
        x2="37"
        y2="32.5"
        stroke="url(#blNeonGlow)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Core Register & Status Indicator Dots */}
      <circle cx="31" cy="27.5" r="1.5" fill="#38bdf8" />
      <circle cx="31" cy="37.5" r="1.5" fill="#a855f7" />
    </svg>
  );
};
