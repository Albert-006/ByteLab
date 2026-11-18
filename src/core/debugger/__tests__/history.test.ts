import { describe, expect, it } from 'vitest';
import { ExecutionHistoryManager } from '../history';
import { Cpu } from '../../cpu';
import { assemble } from '../../assembler';

describe('Execution History Manager & Time Travel', () => {
  it('initializes with snapshot zero as baseline pre-execution state', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const initialCpuState = cpu.getState();

    history.init(initialCpuState);

    const summary = history.getTimelineSummary();
    expect(summary.currentStep).toBe(0);
    expect(summary.totalSteps).toBe(0);
    expect(summary.isAtLatest).toBe(true);
    expect(summary.canStepBackward).toBe(false);
    expect(summary.canStepForward).toBe(false);

    const currentSnap = history.getCurrentSnapshot();
    expect(currentSnap.stepIndex).toBe(0);
    expect(currentSnap.instruction).toBeNull();
    expect(currentSnap.cpuState.registers).toEqual({ A: 0, B: 0, C: 0, D: 0 });
    expect(currentSnap.cpuState.specialRegisters.PC).toBe(0);
    expect(currentSnap.cpuState.specialRegisters.SP).toBe(255);
  });

  it('records snapshots after each instruction and enables backward navigation', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const asm = assemble(`
      LDI A, 10
      LDI B, 20
      ADD A, B
      OUT A
      HLT
    `);
    cpu.loadProgram(asm.instructions);
    history.init(cpu.getState());

    // Step 1: LDI A, 10
    const step1 = cpu.step();
    history.recordStep(step1.state, step1.instruction, step1.aluOperation, step1.flowHighlight);

    // Step 2: LDI B, 20
    const step2 = cpu.step();
    history.recordStep(step2.state, step2.instruction, step2.aluOperation, step2.flowHighlight);

    const summary = history.getTimelineSummary();
    expect(summary.currentStep).toBe(2);
    expect(summary.totalSteps).toBe(2);
    expect(summary.canStepBackward).toBe(true);
    expect(summary.canStepForward).toBe(false);

    const currentSnap = history.getCurrentSnapshot();
    expect(currentSnap.cpuState.registers.A).toBe(10);
    expect(currentSnap.cpuState.registers.B).toBe(20);
    expect(currentSnap.instruction?.mnemonic).toBe('LDI');
  });

  it('navigates backward and forward through history restoring exact CPU state', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const asm = assemble(`
      LDI A, 100
      STORE [0x10], A
      LDI B, 50
      ADD A, B
      OUT A
      HLT
    `);
    cpu.loadProgram(asm.instructions);
    history.init(cpu.getState());

    // Execute entire program
    while (cpu.getState().status !== 'halted') {
      const res = cpu.step();
      history.recordStep(res.state, res.instruction, res.aluOperation, res.flowHighlight);
      if (!res.success) break;
    }

    const totalSteps = history.getTimelineSummary().totalSteps;
    expect(totalSteps).toBe(6); // 6 instructions executed (including HLT)

    // Step backward to Step 5 (before HLT)
    const snap5 = history.stepBackward();
    expect(snap5?.stepIndex).toBe(5);
    expect(snap5?.cpuState.output).toEqual([150]);

    // Step backward to Step 4 (before OUT)
    const snap4 = history.stepBackward();
    expect(snap4?.stepIndex).toBe(4);
    expect(snap4?.cpuState.registers.A).toBe(150);
    expect(snap4?.cpuState.output).toEqual([]); // No output yet at step 4!

    // Step backward to Step 1 (after LDI A, 100)
    history.jumpToStep(1);
    const snap1 = history.getCurrentSnapshot();
    expect(snap1.stepIndex).toBe(1);
    expect(snap1.cpuState.registers.A).toBe(100);
    expect(snap1.cpuState.dataMemory[0x10]).toBe(0); // RAM not written yet at step 1!

    // Step backward to Step 0 (initial state)
    history.stepBackward();
    const snap0 = history.getCurrentSnapshot();
    expect(snap0.stepIndex).toBe(0);
    expect(snap0.cpuState.registers.A).toBe(0);

    // Step forward through history (verifies no re-execution)
    history.stepForwardHistory();
    expect(history.getCurrentSnapshot().stepIndex).toBe(1);
    expect(history.getCurrentSnapshot().cpuState.registers.A).toBe(100);

    history.stepForwardHistory();
    expect(history.getCurrentSnapshot().stepIndex).toBe(2);
    expect(history.getCurrentSnapshot().cpuState.dataMemory[0x10]).toBe(100); // RAM now contains 100
  });

  it('resuming from an earlier position truncates future history', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const asm = assemble(`
      LDI A, 1
      LDI A, 2
      LDI A, 3
      HLT
    `);
    cpu.loadProgram(asm.instructions);
    history.init(cpu.getState());

    // Execute 3 steps
    for (let i = 0; i < 3; i++) {
      const res = cpu.step();
      history.recordStep(res.state, res.instruction, res.aluOperation, res.flowHighlight);
    }
    expect(history.getTimelineSummary().totalSteps).toBe(3);

    // Time-travel back to step 1 (where A was 1)
    history.jumpToStep(1);
    expect(history.getCurrentSnapshot().stepIndex).toBe(1);

    // Now branch: record a new step (e.g. from a different instruction or modified execution)
    cpu.loadState(history.getCurrentSnapshot().cpuState);
    cpu.setRegister('A', 99); // simulate alternate path
    const branchState = cpu.getState();

    history.recordStep(branchState, null);

    // Future snapshots (steps 2 and 3) should now be discarded
    const summary = history.getTimelineSummary();
    expect(summary.totalSteps).toBe(2);
    expect(summary.currentStep).toBe(2);
    expect(history.getCurrentSnapshot().cpuState.registers.A).toBe(99);
  });

  it('safely enforces maximum history length sliding window', () => {
    const cpu = new Cpu();
    const maxLimit = 5;
    const history = new ExecutionHistoryManager(maxLimit);
    history.init(cpu.getState());

    // Record 10 steps
    for (let i = 1; i <= 10; i++) {
      cpu.setRegister('A', i);
      history.recordStep(cpu.getState());
    }

    expect(history.getAllSnapshots().length).toBeLessThanOrEqual(maxLimit);
    expect(history.getCurrentSnapshot().cpuState.registers.A).toBe(10);
  });

  it('captures authoritative ALU metadata and flow highlights', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const asm = assemble(`
      LDI A, 200
      LDI B, 100
      ADD A, B
      HLT
    `);
    cpu.loadProgram(asm.instructions);
    history.init(cpu.getState());

    cpu.step(); // LDI A, 200
    cpu.step(); // LDI B, 100
    const addResult = cpu.step(); // ADD A, B
    const addSnap = history.recordStep(
      addResult.state,
      addResult.instruction,
      addResult.aluOperation,
      addResult.flowHighlight
    );

    expect(addSnap.aluOperation).toBeDefined();
    expect(addSnap.aluOperation?.operation).toBe('ADD');
    expect(addSnap.aluOperation?.leftOperand).toBe(200);
    expect(addSnap.aluOperation?.rightOperand).toBe(100);
    expect(addSnap.aluOperation?.result).toBe(44); // (200 + 100) % 256
    expect(addSnap.aluOperation?.carryBorrow).toBe(true);
    expect(addSnap.aluOperation?.flags.C).toBe(true);

    expect(addSnap.flowHighlight).toBeDefined();
    expect(addSnap.flowHighlight?.activeComponents).toContain('alu');
    expect(addSnap.flowHighlight?.activeComponents).toContain('registerBank');
    expect(addSnap.flowHighlight?.activeRegisters).toContain('A');
    expect(addSnap.flowHighlight?.activeRegisters).toContain('B');
  });

  it('performs full roundtrip integration time travel with memory, arithmetic, and output', () => {
    const cpu = new Cpu();
    const history = new ExecutionHistoryManager(100);
    const source = `
      LDI A, 5
      STORE [0x20], A
      LDI B, 10
      ADD A, B
      STORE [0x21], A
      OUT A
      HLT
    `;
    const asm = assemble(source);
    cpu.loadProgram(asm.instructions);
    history.init(cpu.getState());

    // Run until halt
    while (cpu.getState().status !== 'halted') {
      const stepRes = cpu.step();
      history.recordStep(stepRes.state, stepRes.instruction, stepRes.aluOperation, stepRes.flowHighlight);
      if (stepRes.halted || !stepRes.success) break;
    }

    const finalSnap = history.getCurrentSnapshot();
    expect(finalSnap.cpuState.registers.A).toBe(15);
    expect(finalSnap.cpuState.dataMemory[0x20]).toBe(5);
    expect(finalSnap.cpuState.dataMemory[0x21]).toBe(15);
    expect(finalSnap.cpuState.output).toEqual([15]);

    // Rewind all the way to Step 0
    history.jumpToStep(0);
    const rewound = history.getCurrentSnapshot();
    expect(rewound.cpuState.registers.A).toBe(0);
    expect(rewound.cpuState.dataMemory[0x20]).toBe(0);
    expect(rewound.cpuState.dataMemory[0x21]).toBe(0);
    expect(rewound.cpuState.output).toEqual([]);

    // Fast-forward back to latest step
    history.jumpToStep(history.getTimelineSummary().totalSteps);
    const restored = history.getCurrentSnapshot();
    expect(restored.cpuState.registers.A).toBe(15);
    expect(restored.cpuState.dataMemory[0x20]).toBe(5);
    expect(restored.cpuState.dataMemory[0x21]).toBe(15);
    expect(restored.cpuState.output).toEqual([15]);
  });
});
