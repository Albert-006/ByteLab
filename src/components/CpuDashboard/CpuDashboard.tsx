/**
 * CPU Dashboard Component
 * Renders general-purpose registers, special registers, flags, cycle count, and IR.
 */

import React from 'react';
import { CpuState } from '../../core/types/cpu.types';
import { RegisterCard } from './RegisterCard';
import { FlagBadge } from './FlagBadge';
import { Cpu as CpuIcon, Layers, RotateCw } from 'lucide-react';

export interface CpuDashboardProps {
  cpuState: CpuState;
  previousCpuState: CpuState | null;
}

export const CpuDashboard: React.FC<CpuDashboardProps> = ({
  cpuState,
  previousCpuState,
}) => {
  const { registers, specialRegisters, flags, cycleCount, stackDepth } = cpuState;
  const prevRegs = previousCpuState?.registers;
  const prevSpecial = previousCpuState?.specialRegisters;

  const irInstruction = specialRegisters.IR;
  const irDisplay = irInstruction
    ? `${irInstruction.mnemonic} ${irInstruction.operands
        .map((op) => {
          if (op.type === 'register') return op.register;
          if (op.type === 'immediate') return `0x${op.value.toString(16).toUpperCase()}`;
          if (op.type === 'address') return `[0x${op.address.toString(16).toUpperCase()}]`;
          if (op.type === 'label') return op.label;
          return '';
        })
        .join(', ')}`
    : '--';

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#111722] border border-[#30363d] rounded-lg shadow-lg font-mono">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CpuIcon className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            BL-8 CPU Architecture
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1 text-slate-400">
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Cycles: </span>
            <span className="font-bold text-slate-200">{cycleCount}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Stack Depth: </span>
            <span className="font-bold text-purple-300">{stackDepth}/256</span>
          </div>
        </div>
      </div>

      {/* General Purpose Registers A, B, C, D */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          General-Purpose Registers
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <RegisterCard
            name="A"
            value={registers.A}
            prevValue={prevRegs?.A}
            description="Accumulator"
          />
          <RegisterCard
            name="B"
            value={registers.B}
            prevValue={prevRegs?.B}
            description="General"
          />
          <RegisterCard
            name="C"
            value={registers.C}
            prevValue={prevRegs?.C}
            description="Counter"
          />
          <RegisterCard
            name="D"
            value={registers.D}
            prevValue={prevRegs?.D}
            description="Data"
          />
        </div>
      </div>

      {/* Special Registers PC, SP, IR */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Special Registers & Instruction Decoder
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <RegisterCard
            name="PC"
            value={specialRegisters.PC}
            prevValue={prevSpecial?.PC}
            description="Program Counter"
            isSpecial
          />
          <RegisterCard
            name="SP"
            value={specialRegisters.SP}
            prevValue={prevSpecial?.SP}
            description="Stack Pointer"
            isSpecial
          />

          {/* IR Decoder Card */}
          <div className="flex flex-col p-3 rounded-lg border bg-[#161b22] border-[#30363d] justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold px-1.5 py-0.5 rounded text-[11px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                IR
              </span>
              <span className="text-[10px] text-slate-500">Instruction Register</span>
            </div>
            <div
              data-testid="ir-instruction-text"
              className="text-sm font-bold text-indigo-300 truncate mt-1 bg-black/40 px-2 py-1.5 rounded border border-indigo-950"
            >
              {irDisplay}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
              <span>Opcode:</span>
              <span className="font-semibold text-slate-300">
                {irInstruction
                  ? `0x${irInstruction.opcode.toString(16).toUpperCase().padStart(2, '0')}`
                  : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Flags Z, C, N */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          ALU Status Flags
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <FlagBadge
            name="Z"
            active={flags.Z}
            fullName="Zero"
            description="Set when ALU result is zero"
          />
          <FlagBadge
            name="C"
            active={flags.C}
            fullName="Carry"
            description="Set on overflow (>255) or borrow"
          />
          <FlagBadge
            name="N"
            active={flags.N}
            fullName="Negative"
            description="Set when bit 7 (sign bit) is 1"
          />
        </div>
      </div>
    </div>
  );
};
