/**
 * ALU Visualization Panel Component
 * Displays authoritative operation name, operand values, calculated 8-bit result,
 * carry/borrow, and updated flags from CPU execution metadata.
 */

import React from 'react';
import { AluOperationMetadata } from '../../core/types/cpu.types';
import { Calculator } from 'lucide-react';

export interface AluPanelProps {
  aluOperation?: AluOperationMetadata;
}

export const AluPanel: React.FC<AluPanelProps> = ({ aluOperation }) => {
  if (!aluOperation) {
    return (
      <div
        data-testid="alu-panel-idle"
        className="flex flex-col h-full bg-[#111722] border border-[#30363d] rounded-lg p-3 shadow-lg font-mono text-xs justify-between"
      >
        <div className="flex items-center gap-2 border-b border-[#30363d] pb-2 text-slate-400">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            ALU Operation
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-center">
          <div className="text-sm font-semibold text-slate-400 mb-1">ALU Idle</div>
          <div className="text-[11px] text-slate-600">
            Current instruction does not involve arithmetic or logic operations.
          </div>
        </div>
        <div className="text-[10px] text-slate-600 border-t border-[#30363d]/50 pt-2 flex justify-between">
          <span>Flags:</span>
          <span>Unchanged</span>
        </div>
      </div>
    );
  }

  const { operation, leftOperand, rightOperand, result, carryBorrow, flags } =
    aluOperation;

  const leftHex = `0x${leftOperand.toString(16).toUpperCase().padStart(2, '0')}`;
  const rightHex =
    rightOperand !== undefined
      ? `0x${rightOperand.toString(16).toUpperCase().padStart(2, '0')}`
      : undefined;
  const resultHex = `0x${result.toString(16).toUpperCase().padStart(2, '0')}`;
  const resultBin = result.toString(2).padStart(8, '0');

  // Math operator symbol
  let opSymbol = '';
  switch (operation) {
    case 'ADD':
      opSymbol = '+';
      break;
    case 'SUB':
      opSymbol = '-';
      break;
    case 'INC':
      opSymbol = '+ 1';
      break;
    case 'DEC':
      opSymbol = '- 1';
      break;
    case 'AND':
      opSymbol = '&';
      break;
    case 'OR':
      opSymbol = '|';
      break;
    case 'XOR':
      opSymbol = '^';
      break;
    case 'NOT':
      opSymbol = '~';
      break;
    case 'CMP':
      opSymbol = 'CMP';
      break;
  }

  return (
    <div
      data-testid="alu-panel-active"
      className="flex flex-col h-full bg-[#111722] border border-[#30363d] rounded-lg p-3 shadow-lg font-mono text-xs justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-slate-400">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            ALU Operation
          </span>
        </div>
        <span
          data-testid="alu-op-badge"
          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60"
        >
          {operation}
        </span>
      </div>

      {/* Operation Formula Box */}
      <div className="my-2 p-2.5 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-around text-center">
        {/* Left Operand */}
        <div>
          <div className="text-[10px] text-slate-500">Operand A</div>
          <div className="text-sm font-bold text-slate-200">{leftOperand}</div>
          <div className="text-[10px] text-slate-400">{leftHex}</div>
        </div>

        {/* Operator Symbol */}
        <div className="text-base font-bold text-amber-400 px-1">{opSymbol}</div>

        {/* Right Operand (if binary op) */}
        {rightOperand !== undefined && (
          <div>
            <div className="text-[10px] text-slate-500">Operand B</div>
            <div className="text-sm font-bold text-slate-200">{rightOperand}</div>
            <div className="text-[10px] text-slate-400">{rightHex}</div>
          </div>
        )}

        <div className="text-base font-bold text-slate-500 px-1">=</div>

        {/* Result */}
        <div>
          <div className="text-[10px] text-slate-500">
            {operation === 'CMP' ? 'Diff (Discarded)' : 'Result'}
          </div>
          <div className="text-sm font-bold text-cyan-300">{result}</div>
          <div className="text-[10px] text-cyan-400 font-semibold">{resultHex}</div>
        </div>
      </div>

      {/* Binary representation & Carry Details */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between items-center text-slate-400">
          <span>Result Binary:</span>
          <span className="tracking-widest text-slate-300 font-bold">{resultBin}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Carry / Borrow:</span>
          <span
            className={`font-bold ${
              carryBorrow ? 'text-amber-300' : 'text-slate-600'
            }`}
          >
            {carryBorrow ? '1 (Active)' : '0 (None)'}
          </span>
        </div>
      </div>

      {/* Updated Flags */}
      <div className="border-t border-[#30363d]/60 pt-2 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Updated Flags:</span>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              flags.Z
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'text-slate-600'
            }`}
          >
            Z:{flags.Z ? '1' : '0'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              flags.C
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'text-slate-600'
            }`}
          >
            C:{flags.C ? '1' : '0'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              flags.N
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'text-slate-600'
            }`}
          >
            N:{flags.N ? '1' : '0'}
          </span>
        </div>
      </div>
    </div>
  );
};
