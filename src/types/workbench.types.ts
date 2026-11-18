/**
 * Types for the ByteLab Workbench UI
 */

import { AssemblyResult } from '../core/types/assembler.types';
import { CpuRuntimeError, CpuState } from '../core/types/cpu.types';

export type WorkbenchStatus =
  | 'idle'
  | 'assembled'
  | 'running'
  | 'paused'
  | 'halted'
  | 'error';

export interface ConsoleLogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'out' | 'halt' | 'error' | 'success';
  message: string;
  value?: number;
}

export interface WorkbenchState {
  sourceCode: string;
  isDirty: boolean; // Source modified since last successful assembly
  assemblyResult: AssemblyResult | null;
  cpuState: CpuState;
  previousCpuState: CpuState | null;
  status: WorkbenchStatus;
  speedMs: number; // Interval ms for auto-run (e.g. 50, 200, 500, 1000)
  logs: ConsoleLogEntry[];
  selectedMemoryAddress: number;
  activeSourceLine: number | null; // 1-based source line corresponding to PC
  error: CpuRuntimeError | null;
}
