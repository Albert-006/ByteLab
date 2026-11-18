import { describe, expect, it } from 'vitest';
import { assemble } from '../assembler';
import { ALL_MNEMONICS, OPCODES } from '../../types/instruction.types';

describe('BL-8 Assembler', () => {
  describe('All 21+ Supported Instructions', () => {
    it('correctly assembles every valid instruction', () => {
      const source = `
; Data Movement
MOV A, B
MOV B, C
MOV C, D
MOV D, A
LDI A, 42
LDI B, 0x2A
LOAD C, [10]
LOAD D, [0x10]
STORE [20], A
STORE [0x20], B

; Arithmetic
ADD A, B
SUB C, D
INC A
DEC B

; Logical
AND A, B
OR C, D
XOR A, C
NOT D

; Control
CMP A, B
start:
JMP start
JZ start
JNZ start
JC start
JN start

; Stack and output
PUSH A
POP B
OUT C
HLT
`;

      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.diagnostics).toHaveLength(0);

      // Verify all instructions have correct opcode and addresses
      const mnemonics = result.instructions.map((i) => i.mnemonic);
      expect(mnemonics).toContain('MOV');
      expect(mnemonics).toContain('LDI');
      expect(mnemonics).toContain('LOAD');
      expect(mnemonics).toContain('STORE');
      expect(mnemonics).toContain('ADD');
      expect(mnemonics).toContain('SUB');
      expect(mnemonics).toContain('INC');
      expect(mnemonics).toContain('DEC');
      expect(mnemonics).toContain('AND');
      expect(mnemonics).toContain('OR');
      expect(mnemonics).toContain('XOR');
      expect(mnemonics).toContain('NOT');
      expect(mnemonics).toContain('CMP');
      expect(mnemonics).toContain('JMP');
      expect(mnemonics).toContain('JZ');
      expect(mnemonics).toContain('JNZ');
      expect(mnemonics).toContain('JC');
      expect(mnemonics).toContain('JN');
      expect(mnemonics).toContain('PUSH');
      expect(mnemonics).toContain('POP');
      expect(mnemonics).toContain('OUT');
      expect(mnemonics).toContain('HLT');

      // Verify opcodes match definition
      for (const instr of result.instructions) {
        expect(instr.opcode).toBe(OPCODES[instr.mnemonic]);
      }
    });

    it('covers all mnemonics in ALL_MNEMONICS (22 instructions)', () => {
      expect(ALL_MNEMONICS).toHaveLength(22);
    });
  });

  describe('Case-Insensitivity', () => {
    it('accepts lowercase and mixed case mnemonics and registers', () => {
      const source = `
mov a, b
Ldi c, 0x0f
load d, [100]
store [100], a
add a, b
sub b, c
inc a
dec d
and a, c
or b, d
xor a, d
not b
cmp c, d
target:
jmp Target
jz TARGET
push a
pop b
out c
hlt
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.diagnostics).toHaveLength(0);

      expect(result.instructions[0].mnemonic).toBe('MOV');
      expect(result.instructions[0].operands[0]).toEqual({ type: 'register', register: 'A' });
      expect(result.instructions[0].operands[1]).toEqual({ type: 'register', register: 'B' });
      expect(result.instructions[1].operands[0]).toEqual({ type: 'register', register: 'C' });
      expect(result.instructions[1].operands[1]).toEqual({ type: 'immediate', value: 15 });
    });
  });

  describe('Decimal and Hexadecimal Operands', () => {
    it('parses both decimal and hexadecimal immediate values and addresses', () => {
      const source = `
LDI A, 0
LDI B, 255
LDI C, 0x00
LDI D, 0xFF
LOAD A, [0]
LOAD B, [255]
STORE [0x00], C
STORE [0xFF], D
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.diagnostics).toHaveLength(0);

      expect(result.instructions[0].operands[1]).toEqual({ type: 'immediate', value: 0 });
      expect(result.instructions[1].operands[1]).toEqual({ type: 'immediate', value: 255 });
      expect(result.instructions[2].operands[1]).toEqual({ type: 'immediate', value: 0 });
      expect(result.instructions[3].operands[1]).toEqual({ type: 'immediate', value: 255 });
      expect(result.instructions[4].operands[1]).toEqual({ type: 'address', address: 0 });
      expect(result.instructions[5].operands[1]).toEqual({ type: 'address', address: 255 });
      expect(result.instructions[6].operands[0]).toEqual({ type: 'address', address: 0 });
      expect(result.instructions[7].operands[0]).toEqual({ type: 'address', address: 255 });
    });
  });

  describe('Comments and Blank Lines', () => {
    it('ignores comments and blank lines without altering instruction indices or offsets', () => {
      const source = `
; Initial comment

; Another comment
MOV A, B ; inline comment

; Intermediary comments

LDI C, 10 ; Set counter
HLT
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.instructions).toHaveLength(3);
      expect(result.instructions[0].address).toBe(0);
      expect(result.instructions[1].address).toBe(1);
      expect(result.instructions[2].address).toBe(2);

      // Verify line numbers in source mapping
      expect(result.sourceMap[0]).toBe(5); // line 5: MOV A, B
      expect(result.sourceMap[1]).toBe(9); // line 9: LDI C, 10
      expect(result.sourceMap[2]).toBe(10); // line 10: HLT
    });
  });

  describe('Labels and Resolution', () => {
    it('handles labels on their own lines', () => {
      const source = `
loop:
  INC A
  JMP loop
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.symbolTable['loop']).toBe(0);
      expect(result.instructions[1].operands[0]).toEqual({
        type: 'label',
        label: 'loop',
        resolvedAddress: 0,
      });
    });

    it('resolves both forward and backward label references', () => {
      const source = `
  JMP forward_target
backward_target:
  INC A
  HLT
forward_target:
  MOV B, A
  JMP backward_target
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.symbolTable['backward_target']).toBe(1);
      expect(result.symbolTable['forward_target']).toBe(3);

      // JMP forward_target
      expect(result.instructions[0].operands[0]).toEqual({
        type: 'label',
        label: 'forward_target',
        resolvedAddress: 3,
      });

      // JMP backward_target
      expect(result.instructions[4].operands[0]).toEqual({
        type: 'label',
        label: 'backward_target',
        resolvedAddress: 1,
      });
    });

    it('handles multiple consecutive labels pointing to the same instruction', () => {
      const source = `
start:
entry:
main:
  LDI A, 1
  HLT
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.symbolTable['start']).toBe(0);
      expect(result.symbolTable['entry']).toBe(0);
      expect(result.symbolTable['main']).toBe(0);
    });

    it('rejects duplicate labels with DUPLICATE_LABEL diagnostic', () => {
      const source = `
loop:
  INC A
loop:
  DEC A
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const dup = result.diagnostics.find((d) => d.code === 'DUPLICATE_LABEL');
      expect(dup).toBeDefined();
      expect(dup?.line).toBe(4);
    });

    it('rejects case-insensitively duplicate labels', () => {
      const source = `
Loop:
  INC A
LOOP:
  DEC A
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const dup = result.diagnostics.find((d) => d.code === 'DUPLICATE_LABEL');
      expect(dup).toBeDefined();
    });

    it('rejects undefined labels with UNDEFINED_LABEL diagnostic', () => {
      const source = `
JMP non_existent
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const undef = result.diagnostics.find((d) => d.code === 'UNDEFINED_LABEL');
      expect(undef).toBeDefined();
      expect(undef?.line).toBe(2);
      expect(undef?.message).toContain('non_existent');
    });

    it('rejects invalid label names with INVALID_LABEL_SYNTAX', () => {
      const source = `
123invalid:
  HLT
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diag = result.diagnostics.find((d) => d.code === 'INVALID_LABEL_SYNTAX');
      expect(diag).toBeDefined();
      expect(diag?.line).toBe(2);
    });
  });

  describe('Error Diagnostics for Invalid Instructions and Operands', () => {
    it('diagnoses unknown opcodes with UNKNOWN_MNEMONIC', () => {
      const source = `
FOOBAR A, B
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diag = result.diagnostics.find((d) => d.code === 'UNKNOWN_MNEMONIC');
      expect(diag).toBeDefined();
      expect(diag?.line).toBe(2);
      expect(diag?.message).toContain('FOOBAR');
    });

    it('diagnoses invalid general-purpose registers with INVALID_REGISTER', () => {
      const source = `
MOV E, A
MOV A, X
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_REGISTER');
      expect(diags).toHaveLength(2);
      expect(diags[0].line).toBe(2);
      expect(diags[1].line).toBe(3);
    });

    it('disallows special registers (PC, SP, IR) as general-purpose operands', () => {
      const source = `
MOV PC, A
LDI SP, 10
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_REGISTER');
      expect(diags.length).toBeGreaterThanOrEqual(1);
      expect(diags[0].message).toContain('Special register');
    });

    it('diagnoses missing operands with INVALID_OPERAND_COUNT', () => {
      const source = `
MOV A
LDI B
ADD
LOAD A
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_OPERAND_COUNT');
      expect(diags).toHaveLength(4);
    });

    it('diagnoses extra operands with INVALID_OPERAND_COUNT', () => {
      const source = `
HLT A
INC A, B
NOT C, D, A
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_OPERAND_COUNT');
      expect(diags).toHaveLength(3);
    });

    it('diagnoses type mismatches (e.g. number where register expected)', () => {
      const source = `
MOV 42, B
ADD A, 10
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_OPERAND_TYPE');
      expect(diags).toHaveLength(2);
    });

    it('diagnoses invalid immediate formats with INVALID_NUMBER_FORMAT', () => {
      const source = `
LDI A, 0xGG
LDI B, foo
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_NUMBER_FORMAT');
      expect(diags).toHaveLength(2);
    });

    it('diagnoses out-of-range immediate values with VALUE_OUT_OF_RANGE', () => {
      const source = `
LDI A, -1
LDI B, 256
LDI C, 0x100
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'VALUE_OUT_OF_RANGE');
      expect(diags).toHaveLength(3);
    });

    it('diagnoses malformed memory brackets with MALFORMED_BRACKETS', () => {
      const source = `
LOAD A, [10
LOAD B, 10]
LOAD C, []
STORE 10], A
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'MALFORMED_BRACKETS');
      expect(diags.length).toBeGreaterThanOrEqual(3);
    });

    it('diagnoses memory address missing brackets with INVALID_OPERAND_TYPE', () => {
      const source = `
LOAD A, 10
STORE 20, B
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'INVALID_OPERAND_TYPE');
      expect(diags).toHaveLength(2);
    });

    it('diagnoses out-of-range address values with VALUE_OUT_OF_RANGE', () => {
      const source = `
LOAD A, [300]
STORE [-5], B
`;
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diags = result.diagnostics.filter((d) => d.code === 'VALUE_OUT_OF_RANGE');
      expect(diags).toHaveLength(2);
    });
  });

  describe('Program Size Limit (256 instructions)', () => {
    it('accepts a program with exactly 256 instructions', () => {
      const lines: string[] = [];
      for (let i = 0; i < 256; i++) {
        lines.push('INC A');
      }
      const source = lines.join('\n');
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.instructions).toHaveLength(256);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('rejects a program with 257 instructions with PROGRAM_TOO_LARGE', () => {
      const lines: string[] = [];
      for (let i = 0; i < 257; i++) {
        lines.push('INC A');
      }
      const source = lines.join('\n');
      const result = assemble(source);
      expect(result.success).toBe(false);
      const diag = result.diagnostics.find((d) => d.code === 'PROGRAM_TOO_LARGE');
      expect(diag).toBeDefined();
      expect(diag?.message).toContain('exceeding the maximum program memory capacity of 256');
    });
  });

  describe('Source Line Mapping Accuracy', () => {
    it('maintains accurate 1-based source lines even across interspersed comments and blanks', () => {
      const source = `; Header comment
; Line 2

; Line 4
LDI A, 10 ; Line 5

; Line 7
; Line 8
ADD A, B ; Line 9


HLT ; Line 12
`;
      const result = assemble(source);
      expect(result.success).toBe(true);
      expect(result.instructions).toHaveLength(3);

      expect(result.instructions[0].source.line).toBe(5);
      expect(result.instructions[1].source.line).toBe(9);
      expect(result.instructions[2].source.line).toBe(12);

      expect(result.sourceMap[0]).toBe(5);
      expect(result.sourceMap[1]).toBe(9);
      expect(result.sourceMap[2]).toBe(12);
    });
  });
});
