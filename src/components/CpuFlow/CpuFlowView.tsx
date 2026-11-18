/**
 * BL-8 CPU Datapath Flow Visualization (SVG)
 * Shows core microarchitectural stages and highlights active components,
 * registers, and buses during instruction execution.
 */

import React from 'react';
import { CpuFlowHighlight } from '../../core/types/cpu.types';
import { CpuState } from '../../core/types/cpu.types';
import { Activity } from 'lucide-react';

export interface CpuFlowViewProps {
  highlight?: CpuFlowHighlight;
  cpuState: CpuState;
}

export const CpuFlowView: React.FC<CpuFlowViewProps> = ({ highlight, cpuState }) => {
  const activeComponents = highlight?.activeComponents ?? [];
  const activeRegisters = highlight?.activeRegisters ?? [];

  const isActive = (comp: string) => activeComponents.includes(comp as any);

  const pcVal = cpuState.specialRegisters.PC;
  const irText = cpuState.specialRegisters.IR
    ? `${cpuState.specialRegisters.IR.mnemonic}`
    : '--';

  return (
    <div
      data-testid="cpu-flow-view"
      className="flex flex-col h-full bg-[#111722] border border-[#30363d] rounded-lg p-3 shadow-lg font-mono text-xs overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            CPU Datapath Flow
          </span>
        </div>
        <div
          data-testid="flow-path-description"
          className="text-[11px] text-cyan-300 font-medium truncate max-w-[340px] px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40"
        >
          {highlight?.activePathDescription || 'CPU Idle — Ready to execute'}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full min-h-[220px] relative">
        <svg
          viewBox="0 0 680 240"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#484f58" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* BUS LINES */}
          {/* PC -> Program Memory */}
          <path
            d="M 120 70 L 120 120"
            stroke={isActive('pc') && isActive('programMemory') ? '#38bdf8' : '#30363d'}
            strokeWidth={isActive('pc') && isActive('programMemory') ? '2.5' : '1.5'}
            markerEnd={isActive('pc') && isActive('programMemory') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* Program Memory -> IR */}
          <path
            d="M 190 150 L 230 150"
            stroke={isActive('programMemory') && isActive('ir') ? '#38bdf8' : '#30363d'}
            strokeWidth={isActive('programMemory') && isActive('ir') ? '2.5' : '1.5'}
            markerEnd={isActive('programMemory') && isActive('ir') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* IR -> Control Unit */}
          <path
            d="M 330 150 L 370 150"
            stroke={isActive('ir') && isActive('controlUnit') ? '#38bdf8' : '#30363d'}
            strokeWidth={isActive('ir') && isActive('controlUnit') ? '2.5' : '1.5'}
            markerEnd={isActive('ir') && isActive('controlUnit') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* Control Unit -> RegBank */}
          <path
            d="M 435 120 L 435 70"
            stroke={isActive('controlUnit') && isActive('registerBank') ? '#38bdf8' : '#30363d'}
            strokeWidth={isActive('controlUnit') && isActive('registerBank') ? '2.5' : '1.5'}
            markerEnd={isActive('controlUnit') && isActive('registerBank') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* Control Unit -> Branch to PC */}
          <path
            d="M 400 120 L 400 35 L 180 35"
            stroke={isActive('controlUnit') && isActive('pc') ? '#a855f7' : '#30363d'}
            strokeWidth={isActive('controlUnit') && isActive('pc') ? '2.5' : '1.5'}
            strokeDasharray={isActive('controlUnit') && isActive('pc') ? '4 2' : 'none'}
            markerEnd={isActive('controlUnit') && isActive('pc') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* RegBank -> ALU */}
          <path
            d="M 480 70 L 520 120"
            stroke={isActive('registerBank') && isActive('alu') ? '#f59e0b' : '#30363d'}
            strokeWidth={isActive('registerBank') && isActive('alu') ? '2.5' : '1.5'}
            markerEnd={isActive('registerBank') && isActive('alu') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* RegBank -> Data RAM */}
          <path
            d="M 435 70 L 435 120 L 435 160"
            stroke={isActive('registerBank') && isActive('dataMemory') ? '#38bdf8' : '#30363d'}
            strokeWidth={isActive('registerBank') && isActive('dataMemory') ? '2.5' : '1.5'}
            markerEnd={isActive('registerBank') && isActive('dataMemory') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* RegBank -> Output */}
          <path
            d="M 490 50 L 590 50"
            stroke={isActive('registerBank') && isActive('output') ? '#10b981' : '#30363d'}
            strokeWidth={isActive('registerBank') && isActive('output') ? '2.5' : '1.5'}
            markerEnd={isActive('registerBank') && isActive('output') ? 'url(#arrow-active)' : 'url(#arrow)'}
            fill="none"
          />

          {/* 1. PROGRAM COUNTER (PC) */}
          <g data-testid="flow-pc" transform="translate(60, 20)">
            <rect
              width="120"
              height="50"
              rx="6"
              fill={isActive('pc') ? '#1e293b' : '#161b22'}
              stroke={isActive('pc') ? '#38bdf8' : '#30363d'}
              strokeWidth={isActive('pc') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="60" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              PROGRAM COUNTER
            </text>
            <text x="60" y="40" textAnchor="middle" fill={isActive('pc') ? '#38bdf8' : '#e2e8f0'} fontSize="13" fontWeight="bold">
              PC = {pcVal} (0x{pcVal.toString(16).toUpperCase().padStart(2, '0')})
            </text>
          </g>

          {/* 2. PROGRAM MEMORY */}
          <g data-testid="flow-program-memory" transform="translate(50, 120)">
            <rect
              width="140"
              height="60"
              rx="6"
              fill={isActive('programMemory') ? '#1e293b' : '#161b22'}
              stroke={isActive('programMemory') ? '#38bdf8' : '#30363d'}
              strokeWidth={isActive('programMemory') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="70" y="24" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              PROGRAM MEMORY
            </text>
            <text x="70" y="44" textAnchor="middle" fill="#64748b" fontSize="10">
              256 Instruction Slots
            </text>
          </g>

          {/* 3. INSTRUCTION REGISTER (IR) */}
          <g data-testid="flow-ir" transform="translate(230, 120)">
            <rect
              width="100"
              height="60"
              rx="6"
              fill={isActive('ir') ? '#1e1b4b' : '#161b22'}
              stroke={isActive('ir') ? '#818cf8' : '#30363d'}
              strokeWidth={isActive('ir') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="50" y="24" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">
              INSTR REG (IR)
            </text>
            <text x="50" y="44" textAnchor="middle" fill={isActive('ir') ? '#c7d2fe' : '#e2e8f0'} fontSize="13" fontWeight="bold">
              {irText}
            </text>
          </g>

          {/* 4. CONTROL UNIT / DECODER */}
          <g data-testid="flow-control-unit" transform="translate(370, 120)">
            <rect
              width="100"
              height="60"
              rx="6"
              fill={isActive('controlUnit') ? '#312e81' : '#161b22'}
              stroke={isActive('controlUnit') ? '#a855f7' : '#30363d'}
              strokeWidth={isActive('controlUnit') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="50" y="24" textAnchor="middle" fill="#d8b4fe" fontSize="10" fontWeight="bold">
              CONTROL UNIT
            </text>
            <text x="50" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Instruction Decode
            </text>
          </g>

          {/* 5. REGISTER BANK */}
          <g data-testid="flow-register-bank" transform="translate(370, 20)">
            <rect
              width="130"
              height="50"
              rx="6"
              fill={isActive('registerBank') ? '#1e293b' : '#161b22'}
              stroke={isActive('registerBank') ? '#38bdf8' : '#30363d'}
              strokeWidth={isActive('registerBank') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="65" y="18" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              REGISTER BANK
            </text>
            <text x="65" y="38" textAnchor="middle" fontSize="11" fontWeight="bold">
              <tspan fill={activeRegisters.includes('A') ? '#38bdf8' : '#64748b'}>A:{cpuState.registers.A} </tspan>
              <tspan fill={activeRegisters.includes('B') ? '#38bdf8' : '#64748b'}>B:{cpuState.registers.B} </tspan>
              <tspan fill={activeRegisters.includes('C') ? '#38bdf8' : '#64748b'}>C:{cpuState.registers.C} </tspan>
              <tspan fill={activeRegisters.includes('D') ? '#38bdf8' : '#64748b'}>D:{cpuState.registers.D}</tspan>
            </text>
          </g>

          {/* 6. ALU */}
          <g data-testid="flow-alu" transform="translate(500, 120)">
            <polygon
              points="0,0 80,0 65,60 15,60"
              fill={isActive('alu') ? '#451a03' : '#161b22'}
              stroke={isActive('alu') ? '#f59e0b' : '#30363d'}
              strokeWidth={isActive('alu') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="40" y="24" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="bold">
              ALU
            </text>
            <text x="40" y="44" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
              Z:{cpuState.flags.Z ? 1 : 0} C:{cpuState.flags.C ? 1 : 0} N:{cpuState.flags.N ? 1 : 0}
            </text>
          </g>

          {/* 7. DATA MEMORY (RAM) */}
          <g data-testid="flow-data-memory" transform="translate(370, 185)">
            <rect
              width="120"
              height="45"
              rx="6"
              fill={isActive('dataMemory') ? '#1e1b4b' : '#161b22'}
              stroke={isActive('dataMemory') ? '#818cf8' : '#30363d'}
              strokeWidth={isActive('dataMemory') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="60" y="18" textAnchor="middle" fill="#c7d2fe" fontSize="10" fontWeight="bold">
              DATA RAM (256B)
            </text>
            <text x="60" y="34" textAnchor="middle" fill="#818cf8" fontSize="9">
              SP = 0x{cpuState.specialRegisters.SP.toString(16).toUpperCase().padStart(2, '0')}
            </text>
          </g>

          {/* 8. OUTPUT PORT */}
          <g data-testid="flow-output" transform="translate(590, 25)">
            <rect
              width="75"
              height="45"
              rx="6"
              fill={isActive('output') ? '#064e3b' : '#161b22'}
              stroke={isActive('output') ? '#10b981' : '#30363d'}
              strokeWidth={isActive('output') ? '2' : '1'}
              className="transition-all duration-300"
            />
            <text x="37" y="18" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="bold">
              OUTPUT
            </text>
            <text x="37" y="34" textAnchor="middle" fill={isActive('output') ? '#34d399' : '#94a3b8'} fontSize="11" fontWeight="bold">
              {cpuState.output.length > 0 ? cpuState.output[cpuState.output.length - 1] : '--'}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
