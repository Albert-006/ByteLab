/**
 * Memory Inspector Component
 * Renders 256 bytes of Data Memory (RAM) in a 16x16 grid.
 * Supports memory address watchpoints, cell inspection,
 * and stack pointer position tracking.
 */

import React, { useMemo } from 'react';
import { Database, Eye, BellRing, BellOff } from 'lucide-react';

export interface MemoryInspectorProps {
  dataMemory: number[];
  prevDataMemory?: number[];
  stackPointer: number;
  selectedAddress: number;
  watchpoints: Set<number>;
  onSelectAddress: (address: number) => void;
  onToggleWatchpoint: (address: number) => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  dataMemory,
  prevDataMemory,
  stackPointer,
  selectedAddress,
  watchpoints,
  onSelectAddress,
  onToggleWatchpoint,
}) => {
  const selectedValue = dataMemory[selectedAddress] ?? 0;
  const selectedHex = `0x${selectedValue.toString(16).toUpperCase().padStart(2, '0')}`;
  const selectedBin = selectedValue.toString(2).padStart(8, '0');
  const signedVal = selectedValue > 127 ? selectedValue - 256 : selectedValue;
  const asciiChar =
    selectedValue >= 32 && selectedValue <= 126
      ? String.fromCharCode(selectedValue)
      : '.';

  const isSelectedWatched = watchpoints.has(selectedAddress);

  // Group 256 bytes into 16 rows of 16 bytes
  const rows = useMemo(() => {
    const r: { baseAddress: number; bytes: number[] }[] = [];
    for (let row = 0; row < 16; row++) {
      const base = row * 16;
      r.push({
        baseAddress: base,
        bytes: dataMemory.slice(base, base + 16),
      });
    }
    return r;
  }, [dataMemory]);

  return (
    <div className="flex flex-col h-full p-4 bg-[#111722] border border-[#30363d] rounded-lg shadow-lg font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Data Memory (256 Bytes RAM)
          </span>
          {watchpoints.size > 0 && (
            <span
              data-testid="watchpoints-badge"
              className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold"
            >
              {watchpoints.size} Watched
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/80" />
            <span className="text-slate-400">Changed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500 border border-purple-400" />
            <span className="text-slate-400">SP (0x{stackPointer.toString(16).toUpperCase().padStart(2, '0')})</span>
          </div>
        </div>
      </div>

      {/* 16x16 Grid View */}
      <div className="flex-1 overflow-auto my-3">
        <table className="w-full border-collapse select-none">
          <thead>
            <tr className="text-[10px] text-slate-500 border-b border-[#30363d]/60">
              <th className="p-1 text-left font-normal text-slate-600">ADDR</th>
              {Array.from({ length: 16 }).map((_, col) => (
                <th key={col} className="p-1 text-center font-normal">
                  +{col.toString(16).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.baseAddress} className="hover:bg-[#161b22]/50">
                <td className="p-1 text-[10px] text-slate-500 font-semibold border-r border-[#30363d]/40">
                  0x{row.baseAddress.toString(16).toUpperCase().padStart(2, '0')}
                </td>
                {row.bytes.map((byteVal, colIdx) => {
                  const addr = row.baseAddress + colIdx;
                  const isSelected = addr === selectedAddress;
                  const isSP = addr === stackPointer;
                  const isWatched = watchpoints.has(addr);
                  const isChanged =
                    prevDataMemory !== undefined &&
                    prevDataMemory[addr] !== byteVal;
                  const isNonZero = byteVal > 0;

                  return (
                    <td
                      key={addr}
                      data-testid={`memory-cell-${addr}`}
                      onClick={() => onSelectAddress(addr)}
                      className={`relative p-1 text-center cursor-pointer transition-colors text-[11px] rounded ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold ring-1 ring-white'
                          : isSP
                          ? 'bg-purple-900/60 text-purple-200 border border-purple-500 font-bold'
                          : isChanged
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-500 font-bold animate-pulse'
                          : isWatched
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-600 font-bold'
                          : isNonZero
                          ? 'text-cyan-300 font-semibold'
                          : 'text-slate-600 hover:text-slate-300 hover:bg-[#1c2128]'
                      }`}
                      title={`Address 0x${addr.toString(16).toUpperCase().padStart(2, '0')} (${addr}): Value ${byteVal} (0x${byteVal.toString(16).toUpperCase().padStart(2, '0')})${
                        isWatched ? ' [WATCHED]' : ''
                      }`}
                    >
                      {byteVal.toString(16).toUpperCase().padStart(2, '0')}
                      {isWatched && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Detail Inspector */}
      <div
        data-testid="selected-cell-inspector"
        className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Address:</span>
            <span className="font-bold text-slate-100">
              0x{selectedAddress.toString(16).toUpperCase().padStart(2, '0')} ({selectedAddress})
            </span>
          </div>

          {/* Watchpoint Toggle Button */}
          <button
            data-testid="toggle-watchpoint-btn"
            onClick={() => onToggleWatchpoint(selectedAddress)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
              isSelectedWatched
                ? 'bg-amber-950/80 text-amber-300 border-amber-600 hover:bg-amber-900'
                : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-slate-200'
            }`}
            title={isSelectedWatched ? 'Remove watchpoint' : 'Pause execution when this memory cell changes'}
          >
            {isSelectedWatched ? (
              <>
                <BellOff className="w-3 h-3 text-amber-400" />
                <span>Watching</span>
              </>
            ) : (
              <>
                <BellRing className="w-3 h-3 text-slate-500" />
                <span>Watch</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-slate-500 mr-1.5">Hex:</span>
            <span className="font-bold text-amber-300">{selectedHex}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Decimal:</span>
            <span className="font-bold text-cyan-300">
              {selectedValue} ({signedVal})
            </span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Binary:</span>
            <span className="font-bold text-slate-300">{selectedBin}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">ASCII:</span>
            <span className="font-bold text-slate-300">'{asciiChar}'</span>
          </div>
        </div>
      </div>
    </div>
  );
};
