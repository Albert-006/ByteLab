/**
 * BL-8 CPU Engine Type Definitions
 */

import { Instruction, RegisterName } from './instruction.types';

export type CpuStatus = 'idle' | 'running' | 'halted' | 'error';

export interface RegisterFile {
  A: number; // 0 - 255
  B: number; // 0 - 255
  C: number; // 0 - 255
  D: number; // 0 - 255
}

export interface SpecialRegisterFile {
  PC: number; // 0 - 255
  SP: number; // 0 - 255
  IR: Instruction | null;
}

export interface CpuFlags {
  Z: boolean; // Zero flag
  C: boolean; // Carry / Borrow flag
  N: boolean; // Negative flag
}

export type CpuErrorCode =
  | 'STACK_OVERFLOW'
  | 'STACK_UNDERFLOW'
  | 'PROGRAM_COUNTER_OUT_OF_BOUNDS'
  | 'INVALID_INSTRUCTION'
  | 'MEMORY_OUT_OF_BOUNDS'
  | 'UNRESOLVED_LABEL';

export interface CpuRuntimeError {
  code: CpuErrorCode;
  message: string;
  pc: number;
}

export interface CpuState {
  registers: RegisterFile;
  specialRegisters: SpecialRegisterFile;
  flags: CpuFlags;
  dataMemory: number[]; // 256 bytes (0 to 255)
  programMemory: (Instruction | null)[]; // 256 instruction slots
  output: number[]; // output log of unsigned decimal values
  status: CpuStatus;
  cycleCount: number;
  error: CpuRuntimeError | null;
  stackDepth: number; // 0 to 256 tracking active stack items
}

export interface AluOperationMetadata {
  operation: string; // 'ADD' | 'SUB' | 'INC' | 'DEC' | 'AND' | 'OR' | 'XOR' | 'NOT' | 'CMP';
  leftOperand: number;
  rightOperand?: number;
  result: number;
  carryBorrow: boolean;
  flags: CpuFlags;
}

export type CpuComponentId =
  | 'pc'
  | 'programMemory'
  | 'ir'
  | 'controlUnit'
  | 'registerBank'
  | 'alu'
  | 'dataMemory'
  | 'output';

export interface CpuFlowHighlight {
  activeComponents: CpuComponentId[];
  activeRegisters: RegisterName[];
  activeDataAddress?: number;
  activePathDescription: string;
}

export interface CpuStepResult {
  success: boolean;
  halted: boolean;
  error: CpuRuntimeError | null;
  state: CpuState;
  instruction?: Instruction | null;
  aluOperation?: AluOperationMetadata;
  flowHighlight?: CpuFlowHighlight;
}

export interface ICpu {
  loadProgram(instructions: Instruction[]): void;
  reset(): void;
  step(): CpuStepResult;
  run(maxSteps?: number): CpuStepResult;
  getState(): CpuState;
  loadState(state: CpuState): void;
  getRegister(name: RegisterName): number;
  setRegister(name: RegisterName, value: number): void;
  readDataMemory(address: number): number;
  writeDataMemory(address: number, value: number): void;
}
