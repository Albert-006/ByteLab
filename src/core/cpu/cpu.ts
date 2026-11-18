/**
 * BL-8 Central Processing Unit (CPU)
 * Implements deterministic instruction fetch-decode-execute engine, state tracking,
 * and immutability guarantees.
 */

import { Instruction, RegisterName } from '../types/instruction.types';
import {
  CpuFlags,
  CpuRuntimeError,
  CpuState,
  CpuStatus,
  CpuStepResult,
  ICpu,
} from '../types/cpu.types';
import { executeInstruction } from './execute';
import { createInitialFlags } from './flags';
import { Memory } from './memory';
import { Registers } from './registers';

export class Cpu implements ICpu {
  private registers: Registers = new Registers();
  private memory: Memory = new Memory();
  private flags: CpuFlags = createInitialFlags();
  private output: number[] = [];
  private status: CpuStatus = 'idle';
  private cycleCount: number = 0;
  private error: CpuRuntimeError | null = null;
  private stackDepth: number = 0;

  constructor() {
    this.reset();
  }

  /**
   * Loads parsed instructions into program memory and resets CPU state.
   */
  public loadProgram(instructions: Instruction[]): void {
    this.reset();
    this.memory.loadProgram(instructions);
  }

  /**
   * Resets all registers, flags, memory, stack depth, and output log to initial values.
   */
  public reset(): void {
    this.registers.reset();
    this.memory.reset();
    this.flags = createInitialFlags();
    this.output = [];
    this.status = 'idle';
    this.cycleCount = 0;
    this.error = null;
    this.stackDepth = 0;
  }

  /**
   * Restores complete CPU state from a snapshot (used by Time Travel Debugger).
   */
  public loadState(state: CpuState): void {
    this.registers.set('A', state.registers.A);
    this.registers.set('B', state.registers.B);
    this.registers.set('C', state.registers.C);
    this.registers.set('D', state.registers.D);

    this.registers.setPC(state.specialRegisters.PC);
    this.registers.setSP(state.specialRegisters.SP);
    this.registers.setIR(state.specialRegisters.IR ? { ...state.specialRegisters.IR } : null);

    this.flags = { ...state.flags };

    // Restore data memory
    for (let addr = 0; addr < 256; addr++) {
      this.memory.writeData(addr, state.dataMemory[addr] ?? 0);
    }

    this.output = [...state.output];
    this.status = state.status;
    this.cycleCount = state.cycleCount;
    this.error = state.error ? { ...state.error } : null;
    this.stackDepth = state.stackDepth;
  }

  /**
   * Executes a single instruction step.
   * A step after halt or error does not modify state.
   */
  public step(): CpuStepResult {
    // 1. Guard halted or error states
    if (this.status === 'halted') {
      return {
        success: true,
        halted: true,
        error: null,
        state: this.getState(),
      };
    }

    if (this.status === 'error') {
      return {
        success: false,
        halted: false,
        error: this.error,
        state: this.getState(),
      };
    }

    // Transition idle -> running
    if (this.status === 'idle') {
      this.status = 'running';
    }

    const currentPC = this.registers.getPC();

    // 2. Bounds check PC
    if (currentPC < 0 || currentPC >= 256) {
      this.status = 'error';
      this.error = {
        code: 'PROGRAM_COUNTER_OUT_OF_BOUNDS',
        message: `Program counter ${currentPC} is out of program memory range (0 to 255).`,
        pc: currentPC,
      };
      return {
        success: false,
        halted: false,
        error: this.error,
        state: this.getState(),
      };
    }

    const instruction = this.memory.getInstruction(currentPC);

    // 3. Check for end of program or unmapped slot
    if (!instruction) {
      if (currentPC >= this.memory.getLoadedProgramLength()) {
        // Safe natural termination when reaching beyond loaded instructions
        this.status = 'halted';
        return {
          success: true,
          halted: true,
          error: null,
          state: this.getState(),
        };
      } else {
        this.status = 'error';
        this.error = {
          code: 'PROGRAM_COUNTER_OUT_OF_BOUNDS',
          message: `Attempted to execute unmapped instruction slot at address ${currentPC}.`,
          pc: currentPC,
        };
        return {
          success: false,
          halted: false,
          error: this.error,
          state: this.getState(),
        };
      }
    }

    // 4. Fetch: latch into IR
    this.registers.setIR(instruction);

    // 5. Advance PC before executing instruction
    this.registers.incrementPC();

    // 6. Execute instruction
    const execResult = executeInstruction(instruction, {
      registers: this.registers,
      memory: this.memory,
      flags: this.flags,
      output: this.output,
      stackDepth: this.stackDepth,
    });

    this.flags = execResult.flags;
    this.stackDepth = execResult.stackDepth;
    this.cycleCount++;

    if (execResult.error) {
      this.status = 'error';
      this.error = execResult.error;
      return {
        success: false,
        halted: false,
        error: this.error,
        state: this.getState(),
        instruction,
        aluOperation: execResult.aluOperation,
        flowHighlight: execResult.flowHighlight,
      };
    }

    if (execResult.halted) {
      this.status = 'halted';
      return {
        success: true,
        halted: true,
        error: null,
        state: this.getState(),
        instruction,
        aluOperation: execResult.aluOperation,
        flowHighlight: execResult.flowHighlight,
      };
    }

    return {
      success: true,
      halted: false,
      error: null,
      state: this.getState(),
      instruction,
      aluOperation: execResult.aluOperation,
      flowHighlight: execResult.flowHighlight,
    };
  }

  /**
   * Runs the CPU continuously until halt, error, or reaching maxSteps.
   */
  public run(maxSteps: number = 100_000): CpuStepResult {
    let steps = 0;
    while (steps < maxSteps) {
      const result = this.step();
      steps++;
      if (result.halted || !result.success) {
        return result;
      }
    }

    return {
      success: true,
      halted: false,
      error: null,
      state: this.getState(),
    };
  }

  /**
   * Returns a safe, cloned snapshot of the internal CPU state.
   * Callers cannot accidentally mutate internal CPU state through returned references.
   */
  public getState(): CpuState {
    return {
      registers: this.registers.cloneGeneral(),
      specialRegisters: this.registers.cloneSpecial(),
      flags: { ...this.flags },
      dataMemory: this.memory.cloneData(),
      programMemory: this.memory.cloneProgram(),
      output: [...this.output],
      status: this.status,
      cycleCount: this.cycleCount,
      error: this.error ? { ...this.error } : null,
      stackDepth: this.stackDepth,
    };
  }

  public getRegister(name: RegisterName): number {
    return this.registers.get(name);
  }

  public setRegister(name: RegisterName, value: number): void {
    this.registers.set(name, value);
  }

  public readDataMemory(address: number): number {
    return this.memory.readData(address);
  }

  public writeDataMemory(address: number, value: number): void {
    this.memory.writeData(address, value);
  }
}
