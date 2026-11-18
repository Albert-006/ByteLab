import { describe, expect, it } from 'vitest';
import { EXAMPLE_PROGRAMS } from '../programs';
import { assemble } from '../../core/assembler';
import { Cpu } from '../../core/cpu';

describe('Milestone 5: Example Program Library Verification', () => {
  it('contains at least 5 verified programs', () => {
    expect(EXAMPLE_PROGRAMS.length).toBeGreaterThanOrEqual(5);
    expect(EXAMPLE_PROGRAMS.length).toBe(7);
  });

  for (const prog of EXAMPLE_PROGRAMS) {
    it(`verifies program '${prog.name}' assembles and produces expected output`, () => {
      // 1. Assemble program
      const asmResult = assemble(prog.code);
      expect(
        asmResult.success,
        `Assembly failed for ${prog.name}: ${JSON.stringify(asmResult.diagnostics)}`
      ).toBe(true);
      expect(asmResult.diagnostics).toHaveLength(0);

      // 2. Execute on CPU engine
      const cpu = new Cpu();
      cpu.loadProgram(asmResult.instructions);
      const runResult = cpu.run(10_000);

      expect(runResult.success).toBe(true);
      expect(runResult.halted).toBe(true);

      // 3. Verify emitted output
      const actualOutput = cpu.getState().output;
      expect(actualOutput).toEqual(prog.expectedOutput);
    });
  }
});
