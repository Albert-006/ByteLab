/**
 * Execution Timeline & Time Travel Navigator Component
 * Allows scrubbing, jumping, and stepping through historical CPU execution snapshots.
 */

import React from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  History,
  Clock,
} from 'lucide-react';
import { ExecutionSnapshot, TimelineSummary } from '../../core/debugger/types';

export interface TimelineNavigatorProps {
  summary: TimelineSummary;
  snapshots: readonly ExecutionSnapshot[];
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToStep: (step: number) => void;
}

export const TimelineNavigator: React.FC<TimelineNavigatorProps> = ({
  summary,
  snapshots,
  onStepBackward,
  onStepForward,
  onJumpToStep,
}) => {
  const { currentStep, totalSteps, isAtLatest, canStepBackward, canStepForward } = summary;

  // Compute a visible window of step pills (e.g., up to 9 pills centered on currentStep)
  const windowRadius = 4;
  const startStep = Math.max(0, currentStep - windowRadius);
  const endStep = Math.min(totalSteps, currentStep + windowRadius);
  const visiblePills: number[] = [];
  for (let s = startStep; s <= endStep; s++) {
    visiblePills.push(s);
  }

  return (
    <div
      data-testid="timeline-navigator"
      className="flex flex-col gap-2 p-3 bg-[#111722] border border-[#30363d] rounded-lg shadow-md font-mono text-xs"
    >
      {/* Top Bar: Title & Navigation Status */}
      <div className="flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Time Travel Debugger
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-bold">
            Step {currentStep} / {totalSteps}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {isAtLatest ? (
            <span
              data-testid="timeline-live-badge"
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
            >
              Live Execution Head
            </span>
          ) : (
            <span
              data-testid="timeline-timetravel-badge"
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40 animate-pulse"
            >
              Time-Traveling (Viewing Step {currentStep})
            </span>
          )}
        </div>
      </div>

      {/* Scrub Bar / Range Slider */}
      <div className="flex items-center gap-3">
        <input
          data-testid="timeline-slider"
          type="range"
          min={0}
          max={Math.max(0, totalSteps)}
          value={currentStep}
          onChange={(e) => onJumpToStep(Number(e.target.value))}
          disabled={totalSteps === 0}
          className="flex-1 accent-purple-500 cursor-pointer bg-[#21262d] h-1.5 rounded-lg disabled:opacity-40"
        />
      </div>

      {/* Step Pills & Directional Buttons */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            data-testid="timeline-first-btn"
            disabled={!canStepBackward}
            onClick={() => onJumpToStep(0)}
            className="p-1 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 border border-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Jump to Start (Step 0)"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="timeline-back-btn"
            disabled={!canStepBackward}
            onClick={onStepBackward}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 border border-[#30363d] text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step Backward (Previous Snapshot)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <button
            data-testid="timeline-forward-btn"
            disabled={!canStepForward}
            onClick={onStepForward}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 border border-[#30363d] text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step Forward in History"
          >
            <span>Forward</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="timeline-latest-btn"
            disabled={isAtLatest}
            onClick={() => onJumpToStep(totalSteps)}
            className="p-1 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 border border-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Jump to Latest Snapshot"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Micro-Pills window */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[340px]">
          {visiblePills.map((stepNum) => {
            const isSelected = stepNum === currentStep;
            const snap = snapshots[stepNum];
            const label =
              stepNum === 0
                ? 'Init'
                : snap?.instruction?.mnemonic ?? `#${stepNum}`;

            return (
              <button
                key={stepNum}
                data-testid={`timeline-step-pill-${stepNum}`}
                onClick={() => onJumpToStep(stepNum)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-300'
                    : 'bg-[#161b22] hover:bg-[#21262d] text-slate-400 border border-[#30363d]'
                }`}
                title={`Step ${stepNum}: ${snap?.instruction?.mnemonic || 'Initial state'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
