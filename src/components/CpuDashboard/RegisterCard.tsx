/**
 * Register Display Card Component
 * Shows register name, decimal value, hex representation, and binary bits.
 * Highlights with a transition whenever the value updates.
 */

import React from 'react';

export interface RegisterCardProps {
  name: string;
  value: number;
  prevValue?: number;
  description?: string;
  isSpecial?: boolean;
}

export const RegisterCard: React.FC<RegisterCardProps> = ({
  name,
  value,
  prevValue,
  description,
  isSpecial = false,
}) => {
  const isChanged = prevValue !== undefined && prevValue !== value;
  const hex = `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;
  const binary = value.toString(2).padStart(8, '0');

  return (
    <div
      data-testid={`register-card-${name}`}
      className={`relative flex flex-col p-3 rounded-lg border transition-all duration-300 font-mono ${
        isChanged
          ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/20'
          : 'bg-[#161b22] border-[#30363d] hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span
          className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
            isSpecial
              ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
              : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
          }`}
        >
          {name}
        </span>
        {description && (
          <span className="text-[10px] text-slate-500">{description}</span>
        )}
      </div>

      {/* Main Values: Decimal & Hex */}
      <div className="flex items-baseline justify-between mt-1">
        <div className="text-xl font-bold tracking-tight text-slate-100">
          {value}
        </div>
        <div className="text-sm font-semibold text-slate-400">{hex}</div>
      </div>

      {/* Binary breakdown */}
      <div className="mt-2 text-[10px] text-slate-500 tracking-widest flex justify-between">
        {binary.split('').map((bit, idx) => (
          <span
            key={idx}
            className={`${
              bit === '1' ? 'text-cyan-400 font-bold' : 'text-slate-600'
            }`}
          >
            {bit}
          </span>
        ))}
      </div>
    </div>
  );
};
