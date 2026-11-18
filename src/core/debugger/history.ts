/**
 * BL-8 Execution History Manager
 * Manages full CPU state snapshots, forward/backward time travel navigation,
 * and history branching without external side effects.
 */

import { Instruction } from '../types/instruction.types';
import {
  AluOperationMetadata,
  CpuFlowHighlight,
  CpuState,
} from '../types/cpu.types';
import { ExecutionSnapshot, TimelineSummary } from './types';

export class ExecutionHistoryManager {
  private snapshots: ExecutionSnapshot[] = [];
  private currentIndex: number = 0;
  private readonly maxHistoryLength: number;

  constructor(maxHistoryLength: number = 10_000) {
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Deep clone a CPU state to guarantee snapshot immutability.
   */
  private cloneCpuState(state: CpuState): CpuState {
    return {
      registers: { ...state.registers },
      specialRegisters: {
        PC: state.specialRegisters.PC,
        SP: state.specialRegisters.SP,
        IR: state.specialRegisters.IR ? { ...state.specialRegisters.IR } : null,
      },
      flags: { ...state.flags },
      dataMemory: [...state.dataMemory],
      programMemory: state.programMemory.map((instr) =>
        instr ? { ...instr } : null
      ),
      output: [...state.output],
      status: state.status,
      cycleCount: state.cycleCount,
      error: state.error ? { ...state.error } : null,
      stackDepth: state.stackDepth,
    };
  }

  /**
   * Initializes history with the baseline pre-execution state (Step 0).
   */
  public init(initialState: CpuState): void {
    const baseline: ExecutionSnapshot = {
      stepIndex: 0,
      cpuState: this.cloneCpuState(initialState),
      instruction: null,
      timestamp: Date.now(),
    };
    this.snapshots = [baseline];
    this.currentIndex = 0;
  }

  /**
   * Records a newly executed step.
   * If navigating in the past, discards future history to establish a new timeline branch.
   */
  public recordStep(
    cpuState: CpuState,
    instruction?: Instruction | null,
    aluOperation?: AluOperationMetadata,
    flowHighlight?: CpuFlowHighlight
  ): ExecutionSnapshot {
    // If user time-traveled to an earlier point, truncate all future snapshots
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots.splice(this.currentIndex + 1);
    }

    const nextStepIndex = this.snapshots.length;
    const newSnapshot: ExecutionSnapshot = {
      stepIndex: nextStepIndex,
      cpuState: this.cloneCpuState(cpuState),
      instruction: instruction ? { ...instruction } : null,
      aluOperation: aluOperation ? { ...aluOperation } : undefined,
      flowHighlight: flowHighlight ? { ...flowHighlight } : undefined,
      timestamp: Date.now(),
    };

    // Enforce history boundary
    if (this.snapshots.length >= this.maxHistoryLength) {
      this.snapshots.shift();
    }

    this.snapshots.push(newSnapshot);
    this.currentIndex = this.snapshots.length - 1;

    return this.getSnapshot(this.currentIndex)!;
  }

  public getCurrentSnapshot(): ExecutionSnapshot {
    if (this.snapshots.length === 0) {
      throw new Error('ExecutionHistoryManager has not been initialized with an initial state.');
    }
    return this.getSnapshot(this.currentIndex)!;
  }

  public getSnapshot(index: number): ExecutionSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) {
      return null;
    }
    const snap = this.snapshots[index];
    return {
      ...snap,
      cpuState: this.cloneCpuState(snap.cpuState),
    };
  }

  public canStepBackward(): boolean {
    return this.currentIndex > 0;
  }

  public canStepForwardHistory(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }

  /**
   * Move one step backward in history.
   */
  public stepBackward(): ExecutionSnapshot | null {
    if (!this.canStepBackward()) {
      return null;
    }
    this.currentIndex--;
    return this.getCurrentSnapshot();
  }

  /**
   * Move one step forward through existing historical snapshots.
   */
  public stepForwardHistory(): ExecutionSnapshot | null {
    if (!this.canStepForwardHistory()) {
      return null;
    }
    this.currentIndex++;
    return this.getCurrentSnapshot();
  }

  /**
   * Jump to a specific step in history.
   */
  public jumpToStep(targetIndex: number): ExecutionSnapshot | null {
    if (targetIndex < 0 || targetIndex >= this.snapshots.length) {
      return null;
    }
    this.currentIndex = targetIndex;
    return this.getCurrentSnapshot();
  }

  public getTimelineSummary(): TimelineSummary {
    return {
      currentStep: this.currentIndex,
      totalSteps: Math.max(0, this.snapshots.length - 1),
      isAtLatest: this.currentIndex === this.snapshots.length - 1,
      canStepBackward: this.canStepBackward(),
      canStepForward: this.canStepForwardHistory(),
    };
  }

  public getAllSnapshots(): readonly ExecutionSnapshot[] {
    return this.snapshots;
  }

  public clear(): void {
    this.snapshots = [];
    this.currentIndex = 0;
  }
}
