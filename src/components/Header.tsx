/**
 * Workbench Top Bar Header Component
 * Contains Logo, Program Preset Selector, Execution Controls, Speed Selector, and Status Badge.
 */

import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Binary,
  Layers,
} from 'lucide-react';
import { WorkbenchStatus } from '../types/workbench.types';
import { EXAMPLE_PROGRAMS } from '../examples/programs';

export interface HeaderProps {
  status: WorkbenchStatus;
  isDirty: boolean;
  speedMs: number;
  onAssemble: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speedMs: number) => void;
  onSelectExample: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isDirty,
  speedMs,
  onAssemble,
  onStep,
  onRun,
  onPause,
  onReset,
  onSpeedChange,
  onSelectExample,
}) => {
  const isRunning = status === 'running';
  const isHalted = status === 'halted';
  const isError = status === 'error';

  // Can step only when assembled, not dirty, and neither halted nor error
  const canStep = !isDirty && status !== 'idle' && !isHalted && !isError && !isRunning;
  const canRun = !isDirty && status !== 'idle' && !isHalted && !isError;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-slate-200 font-mono shadow-md">
      {/* Left: Brand & Preset Selector */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <Binary className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-100 tracking-tight">
              ByteLab
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 font-sans">
              BL-8 CPU Workbench
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#30363d]" />

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            data-testid="program-select"
            defaultValue="fibonacci"
            onChange={(e) => onSelectExample(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] text-slate-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 hover:border-slate-500 cursor-pointer"
          >
            {EXAMPLE_PROGRAMS.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Execution Controls */}
      <div className="flex items-center gap-2">
        {/* Assemble Button */}
        <button
          data-testid="assemble-btn"
          onClick={onAssemble}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm ${
            isDirty
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-400/50 animate-pulse'
              : 'bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d]'
          }`}
          title={isDirty ? 'Source modified. Assemble code to load into CPU' : 'Re-assemble code'}
        >
          <Binary className="w-3.5 h-3.5" />
          <span>Assemble</span>
        </button>

        {/* Step Button */}
        <button
          data-testid="step-btn"
          disabled={!canStep}
          onClick={onStep}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
            canStep
              ? 'bg-[#21262d] hover:bg-blue-600 hover:text-white text-slate-200 border border-[#30363d] cursor-pointer'
              : 'bg-[#161b22] text-slate-600 border border-[#21262d] cursor-not-allowed opacity-60'
          }`}
          title={
            isDirty
              ? 'Please assemble code before stepping'
              : isHalted
              ? 'CPU halted'
              : isError
              ? 'CPU in error state'
              : 'Step forward 1 instruction'
          }
        >
          <StepForward className="w-3.5 h-3.5" />
          <span>Step</span>
        </button>

        {/* Run / Pause Button */}
        {isRunning ? (
          <button
            data-testid="pause-btn"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all cursor-pointer"
            title="Pause CPU execution"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            data-testid="run-btn"
            disabled={!canRun}
            onClick={onRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              canRun
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                : 'bg-[#161b22] text-slate-600 border border-[#21262d] cursor-not-allowed opacity-60'
            }`}
            title={
              isDirty
                ? 'Please assemble code before running'
                : isHalted
                ? 'CPU halted'
                : isError
                ? 'CPU in error state'
                : 'Run CPU continuously'
            }
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}

        {/* Reset Button */}
        <button
          data-testid="reset-btn"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-slate-300 border border-[#30363d] transition-all cursor-pointer"
          title="Reset CPU state and Program Counter to 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-2 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 hidden sm:inline">Speed:</span>
          <select
            data-testid="speed-select"
            value={speedMs}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-[#0d1117] border border-[#30363d] text-slate-300 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value={1000}>1 Hz (Slow)</option>
            <option value={500}>2 Hz</option>
            <option value={200}>5 Hz (Default)</option>
            <option value={100}>10 Hz</option>
            <option value={30}>30 Hz (Fast)</option>
          </select>
        </div>
      </div>

      {/* Right: Status Badge */}
      <div className="flex items-center gap-2 text-xs">
        <div
          data-testid="status-badge"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
            isDirty
              ? 'bg-amber-950/60 text-amber-300 border-amber-600/40'
              : status === 'running'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
              : status === 'paused'
              ? 'bg-blue-950/60 text-blue-300 border-blue-600/40'
              : status === 'halted'
              ? 'bg-purple-950/60 text-purple-300 border-purple-600/40'
              : status === 'error'
              ? 'bg-red-950/60 text-red-300 border-red-600/40'
              : 'bg-[#21262d] text-slate-400 border-[#30363d]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isDirty
                ? 'bg-amber-400'
                : status === 'running'
                ? 'bg-emerald-400 animate-ping'
                : status === 'paused'
                ? 'bg-blue-400'
                : status === 'halted'
                ? 'bg-purple-400'
                : status === 'error'
                ? 'bg-red-400'
                : 'bg-slate-500'
            }`}
          />
          <span>{isDirty ? 'Source Modified' : status}</span>
        </div>
      </div>
    </header>
  );
};
