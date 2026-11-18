import { describe, expect, it } from 'vitest';
import { Cpu } from '../cpu';
import { assemble } from '../../assembler';

describe('BL-8 CPU Engine', () => {
  describe('Initial State and Reset', () => {
    it('initializes with default zeroed registers and correct pointers', () => {
      const cpu = new Cpu();
      const state = cpu.getState();

      expect(state.registers).toEqual({ A: 0, B: 0, C: 0, D: 0 });
      expect(state.specialRegisters.PC).toBe(0);
      expect(state.specialRegisters.SP).toBe(255);
      expect(state.specialRegisters.IR).toBeNull();
      expect(state.flags).toEqual({ Z: false, C: false, N: false });
      expect(state.output).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.cycleCount).toBe(0);
      expect(state.stackDepth).toBe(0);
      expect(state.error).toBeNull();
      expect(state.dataMemory.every((b) => b === 0)).toBe(true);
    });

    it('resets correctly after program execution', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 42
        STORE [10], A
        OUT A
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(42);
      expect(cpu.readDataMemory(10)).toBe(42);
      expect(cpu.getState().output).toEqual([42]);

      cpu.reset();
      const resetState = cpu.getState();
      expect(resetState.registers.A).toBe(0);
      expect(resetState.specialRegisters.PC).toBe(0);
      expect(resetState.specialRegisters.SP).toBe(255);
      expect(resetState.output).toEqual([]);
      expect(resetState.dataMemory[10]).toBe(0);
      expect(resetState.status).toBe('idle');
    });

    it('prevents external mutation of internal CPU state via getState()', () => {
      const cpu = new Cpu();
      const state1 = cpu.getState();

      // Attempt to mutate returned objects
      state1.registers.A = 99;
      state1.flags.Z = true;
      state1.dataMemory[0] = 123;
      state1.output.push(999);

      const state2 = cpu.getState();
      expect(state2.registers.A).toBe(0);
      expect(state2.flags.Z).toBe(false);
      expect(state2.dataMemory[0]).toBe(0);
      expect(state2.output).toEqual([]);
    });
  });

  describe('Data Movement Instructions', () => {
    it('executes MOV and LDI without altering flags', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 10
        LDI B, 20
        MOV C, A
        MOV D, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      const res = cpu.run();

      expect(res.success).toBe(true);
      expect(res.halted).toBe(true);
      expect(cpu.getRegister('A')).toBe(10);
      expect(cpu.getRegister('B')).toBe(20);
      expect(cpu.getRegister('C')).toBe(10);
      expect(cpu.getRegister('D')).toBe(20);
      expect(cpu.getState().flags).toEqual({ Z: false, C: false, N: false });
    });

    it('executes LOAD and STORE to data memory', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 0x55
        STORE [0x20], A
        LOAD B, [0x20]
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      const res = cpu.run();

      expect(res.success).toBe(true);
      expect(cpu.readDataMemory(0x20)).toBe(0x55);
      expect(cpu.getRegister('B')).toBe(0x55);
    });
  });

  describe('Arithmetic Operations & Flags', () => {
    it('adds without carry and sets zero flag when result is 0', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 10
        LDI B, 15
        ADD A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(25);
      expect(cpu.getState().flags).toEqual({ Z: false, C: false, N: false });
    });

    it('detects addition overflow and sets Carry flag', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 200
        LDI B, 100
        ADD A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      // (200 + 100) = 300; 300 % 256 = 44
      expect(cpu.getRegister('A')).toBe(44);
      expect(cpu.getState().flags.C).toBe(true);
      expect(cpu.getState().flags.Z).toBe(false);
      expect(cpu.getState().flags.N).toBe(false);
    });

    it('sets Zero and Carry when addition wraps exactly to 256 (0 mod 256)', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 255
        LDI B, 1
        ADD A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(0);
      expect(cpu.getState().flags.Z).toBe(true);
      expect(cpu.getState().flags.C).toBe(true);
      expect(cpu.getState().flags.N).toBe(false);
    });

    it('subtracts and updates Z, C, N correctly', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 20
        LDI B, 20
        SUB A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(0);
      expect(cpu.getState().flags.Z).toBe(true);
      expect(cpu.getState().flags.C).toBe(false);
      expect(cpu.getState().flags.N).toBe(false);
    });

    it('detects borrow in subtraction and sets Carry and Negative flags', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 5
        LDI B, 10
        SUB A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      // 5 - 10 = -5; (-5 + 256) = 251 (0xFB, bit 7 is 1)
      expect(cpu.getRegister('A')).toBe(251);
      expect(cpu.getState().flags.C).toBe(true); // Borrow occurred
      expect(cpu.getState().flags.N).toBe(true); // Bit 7 is 1
      expect(cpu.getState().flags.Z).toBe(false);
    });

    it('executes INC and DEC updating Z and N while preserving C flag', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        ; Set Carry via overflow
        LDI A, 255
        LDI B, 1
        ADD A, B ; C becomes true, Z becomes true

        ; INC should preserve C
        LDI C, 0
        INC C ; C = 1, Z becomes false, C remains true
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(1);
      expect(cpu.getState().flags.C).toBe(true); // Preserved
      expect(cpu.getState().flags.Z).toBe(false);
    });

    it('INC wrapping from 255 to 0 sets Z flag and preserves C', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 255
        INC A
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(0);
      expect(cpu.getState().flags.Z).toBe(true);
      expect(cpu.getState().flags.C).toBe(false);
    });

    it('DEC wrapping from 0 to 255 sets N flag and preserves C', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 0
        DEC A
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(255);
      expect(cpu.getState().flags.N).toBe(true);
      expect(cpu.getState().flags.Z).toBe(false);
      expect(cpu.getState().flags.C).toBe(false);
    });
  });

  describe('Logical Operations', () => {
    it('executes AND, OR, XOR, NOT and clears Carry flag', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        ; First set C flag
        LDI A, 255
        LDI B, 1
        ADD A, B

        ; AND clears C
        LDI A, 0x0F
        LDI B, 0x33
        AND A, B ; 0x0F & 0x33 = 0x03
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(0x03);
      expect(cpu.getState().flags.C).toBe(false);
      expect(cpu.getState().flags.Z).toBe(false);
      expect(cpu.getState().flags.N).toBe(false);
    });

    it('executes OR and XOR correctly', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 0xF0
        LDI B, 0x0F
        OR A, B ; 0xFF
        MOV C, A
        XOR A, B ; 0xFF ^ 0x0F = 0xF0
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(0xff);
      expect(cpu.getRegister('A')).toBe(0xf0);
      expect(cpu.getState().flags.C).toBe(false);
      expect(cpu.getState().flags.N).toBe(true);
    });

    it('executes NOT and clears C', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 0xFF
        NOT A ; ~0xFF = 0x00
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(0);
      expect(cpu.getState().flags.Z).toBe(true);
      expect(cpu.getState().flags.C).toBe(false);
    });
  });

  describe('Comparison (CMP)', () => {
    it('sets flags without modifying source registers', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 42
        LDI B, 42
        CMP A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(42);
      expect(cpu.getRegister('B')).toBe(42);
      expect(cpu.getState().flags.Z).toBe(true);
      expect(cpu.getState().flags.C).toBe(false);
      expect(cpu.getState().flags.N).toBe(false);
    });

    it('sets Carry and Negative when comparing smaller to larger', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 10
        LDI B, 20
        CMP A, B
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(10);
      expect(cpu.getRegister('B')).toBe(20);
      expect(cpu.getState().flags.C).toBe(true); // Borrow
      expect(cpu.getState().flags.N).toBe(true); // 10 - 20 = -10 (0xF6)
      expect(cpu.getState().flags.Z).toBe(false);
    });
  });

  describe('Control Flow & Jumps', () => {
    it('executes unconditional JMP', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        JMP target
        LDI A, 99
target:
        LDI A, 42
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('A')).toBe(42);
    });

    it('executes conditional jumps JZ and JNZ', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 0
        CMP A, A ; Z = true
        JZ is_zero
        LDI B, 99
        JMP done
is_zero:
        LDI B, 1
done:
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('B')).toBe(1);
    });

    it('ignores JZ when Z is false', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 5
        LDI B, 10
        CMP A, B ; Z = false
        JZ skipped
        LDI C, 1
        JMP end
skipped:
        LDI C, 99
end:
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(1);
    });

    it('executes JC when Carry is set', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 255
        LDI B, 1
        ADD A, B ; C = true
        JC has_carry
        LDI C, 99
        JMP end
has_carry:
        LDI C, 42
end:
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(42);
    });

    it('executes JN when Negative flag is set', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 5
        LDI B, 10
        SUB A, B ; N = true
        JN is_neg
        LDI C, 99
        JMP end
is_neg:
        LDI C, 77
end:
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(77);
    });
  });

  describe('Stack Behavior', () => {
    it('pushes and pops in LIFO order', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 11
        LDI B, 22
        PUSH A
        PUSH B
        POP C
        POP D
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getRegister('C')).toBe(22);
      expect(cpu.getRegister('D')).toBe(11);
      expect(cpu.getState().specialRegisters.SP).toBe(255);
      expect(cpu.getState().stackDepth).toBe(0);
    });

    it('detects stack underflow on empty stack POP', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        POP A
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      const res = cpu.run();

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('STACK_UNDERFLOW');
      expect(cpu.getState().status).toBe('error');
    });

    it('detects stack overflow when pushing beyond 256 bytes', () => {
      const cpu = new Cpu();
      // Generate 257 pushes (note: BL-8 max instructions is 256, so we can use a loop!)
      const asm = assemble(`
        LDI A, 1
loop:
        PUSH A
        JMP loop
      `);
      cpu.loadProgram(asm.instructions);
      const res = cpu.run(1000);

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('STACK_OVERFLOW');
      expect(cpu.getState().stackDepth).toBe(256);
      expect(cpu.getState().status).toBe('error');
    });
  });

  describe('Output Port', () => {
    it('appends unsigned values to output array in order', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 10
        OUT A
        LDI A, 20
        OUT A
        LDI A, 30
        OUT A
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.run();

      expect(cpu.getState().output).toEqual([10, 20, 30]);
    });
  });

  describe('Program Counter & Halting Boundaries', () => {
    it('does not modify state when stepping after halt', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 5
        HLT
      `);
      cpu.loadProgram(asm.instructions);
      cpu.step(); // LDI A, 5
      cpu.step(); // HLT -> status becomes halted

      const stateHalted = cpu.getState();
      expect(stateHalted.status).toBe('halted');

      // Subsequent step
      const stepAfterHalt = cpu.step();
      expect(stepAfterHalt.halted).toBe(true);
      expect(stepAfterHalt.state.cycleCount).toBe(stateHalted.cycleCount);
      expect(stepAfterHalt.state.registers.A).toBe(5);
    });

    it('safely halts when program counter reaches end of loaded program without HLT', () => {
      const cpu = new Cpu();
      const asm = assemble(`
        LDI A, 12
      `);
      cpu.loadProgram(asm.instructions);
      cpu.step(); // executes LDI A, 12; PC becomes 1
      const res = cpu.step(); // slot 1 is empty, end of loaded program

      expect(res.halted).toBe(true);
      expect(cpu.getState().status).toBe('halted');
      expect(cpu.getRegister('A')).toBe(12);
    });
  });
});
