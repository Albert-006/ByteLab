import { describe, expect, it } from 'vitest';
import { Cpu } from '../cpu';
import { assemble } from '../../assembler';

describe('BL-8 CPU Integration Programs', () => {
  it('Program 1: Basic Addition and Output', () => {
    const source = `
      LDI A, 35
      LDI B, 65
      ADD A, B
      OUT A
      HLT
    `;
    const asm = assemble(source);
    expect(asm.success).toBe(true);

    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);
    const result = cpu.run();

    expect(result.success).toBe(true);
    expect(result.halted).toBe(true);
    expect(cpu.getRegister('A')).toBe(100);
    expect(cpu.getState().output).toEqual([100]);
  });

  it('Program 2: Counter Loop (Down from 5 to 0)', () => {
    const source = `
      LDI A, 5
      LDI B, 0
loop:
      OUT A
      DEC A
      CMP A, B
      JNZ loop
      OUT A ; Output 0
      HLT
    `;
    const asm = assemble(source);
    expect(asm.success).toBe(true);

    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);
    const result = cpu.run();

    expect(result.success).toBe(true);
    expect(result.halted).toBe(true);
    expect(cpu.getState().output).toEqual([5, 4, 3, 2, 1, 0]);
  });

  it('Program 3: Memory Array Summation', () => {
    // Store 3 numbers at addresses 0x10, 0x11, 0x12, then sum them
    const source = `
      ; Initialize data array
      LDI A, 7
      STORE [0x10], A
      LDI A, 8
      STORE [0x11], A
      LDI A, 9
      STORE [0x12], A

      ; Accumulate sum in B
      LDI B, 0
      LOAD C, [0x10]
      ADD B, C
      LOAD C, [0x11]
      ADD B, C
      LOAD C, [0x12]
      ADD B, C

      ; Save total to [0x20] and OUT
      STORE [0x20], B
      OUT B
      HLT
    `;
    const asm = assemble(source);
    expect(asm.success).toBe(true);

    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);
    const result = cpu.run();

    expect(result.success).toBe(true);
    expect(cpu.readDataMemory(0x20)).toBe(24);
    expect(cpu.getState().output).toEqual([24]);
  });

  it('Program 4: Fibonacci Sequence Generation', () => {
    // Generates first 7 Fibonacci numbers: 0, 1, 1, 2, 3, 5, 8
    const source = `
      LDI A, 0 ; F(n)
      LDI B, 1 ; F(n+1)
      LDI C, 7 ; Loop count

fib_loop:
      OUT A
      MOV D, A ; D = F(n)
      ADD D, B ; D = F(n) + F(n+1)
      MOV A, B ; A = F(n+1)
      MOV B, D ; B = F(n+2)
      DEC C
      JNZ fib_loop

      HLT
    `;
    const asm = assemble(source);
    expect(asm.success).toBe(true);

    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);
    const result = cpu.run();

    expect(result.success).toBe(true);
    expect(result.halted).toBe(true);
    expect(cpu.getState().output).toEqual([0, 1, 1, 2, 3, 5, 8]);
  });

  it('Program 5: Stack Subroutine Simulation and Data Reversal', () => {
    // Pushes 3 values, reverses order via pop
    const source = `
      LDI A, 100
      LDI B, 200
      LDI C, 50

      PUSH A
      PUSH B
      PUSH C

      POP A ; Should be 50
      OUT A
      POP B ; Should be 200
      OUT B
      POP C ; Should be 100
      OUT C

      HLT
    `;
    const asm = assemble(source);
    expect(asm.success).toBe(true);

    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);
    const result = cpu.run();

    expect(result.success).toBe(true);
    expect(cpu.getState().output).toEqual([50, 200, 100]);
    expect(cpu.getState().specialRegisters.SP).toBe(255);
  });

  it('Program 6: Determinism Verification Across Multiple Runs', () => {
    const source = `
      LDI A, 0
      LDI B, 1
      LDI C, 6
loop:
      OUT A
      MOV D, A
      ADD D, B
      MOV A, B
      MOV B, D
      DEC C
      JNZ loop
      HLT
    `;
    const asm = assemble(source);
    const cpu = new Cpu();
    cpu.loadProgram(asm.instructions);

    // Run 1
    const run1Result = cpu.run();
    const run1State = cpu.getState();

    // Reset and Run 2
    cpu.reset();
    cpu.loadProgram(asm.instructions);
    const run2Result = cpu.run();
    const run2State = cpu.getState();

    expect(run1Result).toEqual(run2Result);
    expect(run1State.registers).toEqual(run2State.registers);
    expect(run1State.specialRegisters).toEqual(run2State.specialRegisters);
    expect(run1State.flags).toEqual(run2State.flags);
    expect(run1State.output).toEqual(run2State.output);
    expect(run1State.cycleCount).toEqual(run2State.cycleCount);
    expect(run1State.dataMemory).toEqual(run2State.dataMemory);
  });
});
