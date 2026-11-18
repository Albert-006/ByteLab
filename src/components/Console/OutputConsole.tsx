/**
 * Output Console Component
 * Displays values emitted by OUT instructions along with execution and error logs.
 */

import React, { useEffect, useRef } from 'react';
import { ConsoleLogEntry } from '../../types/workbench.types';
import { Terminal, Trash2 } from 'lucide-react';

export interface OutputConsoleProps {
  logs: ConsoleLogEntry[];
  onClear: () => void;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#111722] border border-[#30363d] rounded-lg shadow-lg font-mono text-xs overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
            Output Console
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400 border border-slate-700">
            {logs.length} logs
          </span>
        </div>
        <button
          data-testid="clear-console-btn"
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
          title="Clear console logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        data-testid="console-log-list"
        className="flex-1 p-3 overflow-y-auto space-y-1.5 min-h-[140px] max-h-[220px]"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-4 text-center">
            No output emitted yet. Assemble and step through a program to see OUT logs.
          </div>
        ) : (
          logs.map((log) => {
            let badgeClass = 'bg-slate-800 text-slate-300';
            let textClass = 'text-slate-300';

            if (log.type === 'out') {
              badgeClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold';
              textClass = 'text-emerald-300 font-semibold text-sm';
            } else if (log.type === 'error') {
              badgeClass = 'bg-red-950/80 text-red-300 border border-red-800/60';
              textClass = 'text-red-400 font-medium';
            } else if (log.type === 'halt') {
              badgeClass = 'bg-amber-950/80 text-amber-300 border border-amber-800/60';
              textClass = 'text-amber-300 font-medium';
            } else if (log.type === 'success') {
              badgeClass = 'bg-blue-950/80 text-blue-300 border border-blue-800/60';
              textClass = 'text-blue-300';
            }

            return (
              <div
                key={log.id}
                className="flex items-baseline gap-2 py-0.5 border-b border-[#30363d]/20 last:border-b-0"
              >
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${badgeClass}`}>
                  {log.type}
                </span>
                <span className={`flex-1 break-all ${textClass}`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
