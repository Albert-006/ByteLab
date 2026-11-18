/**
 * Execution History and Time Travel Debugger Types
 */

import { Instruction } from '../types/instruction.types';
import { AluOperationMetadata, CpuFlowHighlight, CpuState } from '../types/cpu.types';

export interface ExecutionSnapshot {
  stepIndex: number; // 0 is initial pre-execution state
  cpuState: CpuState; // Full observable CPU state
  instruction: Instruction | null; // Instruction that executed to produce this state
  aluOperation?: AluOperationMetadata;
  flowHighlight?: CpuFlowHighlight;
  timestamp: number;
}

export interface TimelineSummary {
  currentStep: number;
  totalSteps: number; // snapshots.length - 1
  isAtLatest: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
}
