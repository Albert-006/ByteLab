/**
 * Status Flag Badge Component
 */

import React from 'react';

export interface FlagBadgeProps {
  name: 'Z' | 'C' | 'N';
  active: boolean;
  fullName: string;
  description: string;
}

export const FlagBadge: React.FC<FlagBadgeProps> = ({
  name,
  active,
  fullName,
  description,
}) => {
  return (
    <div
      data-testid={`flag-badge-${name}`}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border font-mono transition-all duration-200 ${
        active
          ? 'bg-amber-950/40 border-amber-500/80 text-amber-300 shadow-sm shadow-amber-500/20'
          : 'bg-[#161b22] border-[#30363d] text-slate-500'
      }`}
      title={`${fullName}: ${description}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            active ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
          }`}
        />
        <span className="font-bold text-sm text-slate-200">{name}</span>
        <span className="text-[11px] text-slate-400">({fullName})</span>
      </div>
      <span
        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
          active
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-black/30 text-slate-600'
        }`}
      >
        {active ? '1' : '0'}
      </span>
    </div>
  );
};
