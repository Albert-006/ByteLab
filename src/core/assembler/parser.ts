/**
 * Parser for BL-8 Assembly Language
 * Converts normalized lines into intermediate tokens and parsed instructions.
 */

import {
  isRegisterName,
  OPCODES,
  OpcodeMnemonic,
  Operand,
  RegisterName,
} from '../types/instruction.types';
import {
  AssemblerDiagnostic,
  ParsedInstructionLine,
  ParsedLabel,
  RawSourceLine,
} from '../types/assembler.types';
import {
  isValidLabelIdentifier,
  parseNumberLiteral,
  splitOperands,
} from './lexer';

export type ExpectedOperandKind = 'register' | 'immediate' | 'address' | 'label';

export interface InstructionSpec {
  mnemonic: OpcodeMnemonic;
  opcode: number;
  operands: ExpectedOperandKind[];
}

export const INSTRUCTION_SPECS: Record<OpcodeMnemonic, InstructionSpec> = {
  MOV: { mnemonic: 'MOV', opcode: OPCODES.MOV, operands: ['register', 'register'] },
  LDI: { mnemonic: 'LDI', opcode: OPCODES.LDI, operands: ['register', 'immediate'] },
  LOAD: { mnemonic: 'LOAD', opcode: OPCODES.LOAD, operands: ['register', 'address'] },
  STORE: { mnemonic: 'STORE', opcode: OPCODES.STORE, operands: ['address', 'register'] },
  ADD: { mnemonic: 'ADD', opcode: OPCODES.ADD, operands: ['register', 'register'] },
  SUB: { mnemonic: 'SUB', opcode: OPCODES.SUB, operands: ['register', 'register'] },
  INC: { mnemonic: 'INC', opcode: OPCODES.INC, operands: ['register'] },
  DEC: { mnemonic: 'DEC', opcode: OPCODES.DEC, operands: ['register'] },
  AND: { mnemonic: 'AND', opcode: OPCODES.AND, operands: ['register', 'register'] },
  OR: { mnemonic: 'OR', opcode: OPCODES.OR, operands: ['register', 'register'] },
  XOR: { mnemonic: 'XOR', opcode: OPCODES.XOR, operands: ['register', 'register'] },
  NOT: { mnemonic: 'NOT', opcode: OPCODES.NOT, operands: ['register'] },
  CMP: { mnemonic: 'CMP', opcode: OPCODES.CMP, operands: ['register', 'register'] },
  JMP: { mnemonic: 'JMP', opcode: OPCODES.JMP, operands: ['label'] },
  JZ: { mnemonic: 'JZ', opcode: OPCODES.JZ, operands: ['label'] },
  JNZ: { mnemonic: 'JNZ', opcode: OPCODES.JNZ, operands: ['label'] },
  JC: { mnemonic: 'JC', opcode: OPCODES.JC, operands: ['label'] },
  JN: { mnemonic: 'JN', opcode: OPCODES.JN, operands: ['label'] },
  PUSH: { mnemonic: 'PUSH', opcode: OPCODES.PUSH, operands: ['register'] },
  POP: { mnemonic: 'POP', opcode: OPCODES.POP, operands: ['register'] },
  OUT: { mnemonic: 'OUT', opcode: OPCODES.OUT, operands: ['register'] },
  HLT: { mnemonic: 'HLT', opcode: OPCODES.HLT, operands: [] },
};

export interface ParseFirstPassResult {
  parsedLabels: ParsedLabel[];
  parsedLines: ParsedInstructionLine[];
  diagnostics: AssemblerDiagnostic[];
}

/**
 * First pass: extracts labels and instruction lines, assigning preliminary instruction indices.
 */
export function parseFirstPass(lines: RawSourceLine[]): ParseFirstPassResult {
  const parsedLabels: ParsedLabel[] = [];
  const parsedLines: ParsedInstructionLine[] = [];
  const diagnostics: AssemblerDiagnostic[] = [];

  let currentInstructionIndex = 0;

  for (const line of lines) {
    if (!line.sanitizedText) {
      continue; // Skip blank or comment-only lines
    }

    let remainingText = line.sanitizedText;

    // Extract any labels defined at the beginning of the line
    while (true) {
      const colonIdx = remainingText.indexOf(':');
      if (colonIdx === -1) {
        break;
      }

      const labelCandidate = remainingText.slice(0, colonIdx).trim();
      const afterColon = remainingText.slice(colonIdx + 1).trim();

      // Check if this candidate is a valid label
      if (!isValidLabelIdentifier(labelCandidate)) {
        diagnostics.push({
          code: 'INVALID_LABEL_SYNTAX',
          message: `Invalid label name '${labelCandidate}'. Labels must start with a letter or underscore and contain only alphanumeric characters.`,
          line: line.lineNumber,
          severity: 'error',
        });
      } else {
        parsedLabels.push({
          name: labelCandidate,
          source: {
            line: line.lineNumber,
            column: line.rawText.indexOf(labelCandidate) + 1,
            text: labelCandidate,
          },
          instructionIndex: currentInstructionIndex,
        });
      }

      remainingText = afterColon;
    }

    if (!remainingText) {
      // Line only contained label(s)
      continue;
    }

    // Now remainingText should be an instruction
    const spaceIdx = remainingText.search(/\s/);
    let mnemonicText: string;
    let operandsStr: string;

    if (spaceIdx === -1) {
      mnemonicText = remainingText;
      operandsStr = '';
    } else {
      mnemonicText = remainingText.slice(0, spaceIdx);
      operandsStr = remainingText.slice(spaceIdx).trim();
    }

    const operandTexts = operandsStr ? splitOperands(operandsStr) : [];

    parsedLines.push({
      instructionIndex: currentInstructionIndex,
      mnemonicText,
      operandTexts,
      source: {
        line: line.lineNumber,
        column: line.rawText.toLowerCase().indexOf(mnemonicText.toLowerCase()) + 1,
        text: remainingText,
      },
    });

    currentInstructionIndex++;
  }

  return {
    parsedLabels,
    parsedLines,
    diagnostics,
  };
}

/**
 * Parses and validates operands for an instruction line.
 */
export function parseOperandsForInstruction(
  parsedLine: ParsedInstructionLine,
  spec: InstructionSpec
): { operands: Operand[]; diagnostics: AssemblerDiagnostic[] } {
  const diagnostics: AssemblerDiagnostic[] = [];
  const operands: Operand[] = [];

  const { operandTexts, source } = parsedLine;

  if (operandTexts.length !== spec.operands.length) {
    diagnostics.push({
      code: 'INVALID_OPERAND_COUNT',
      message: `Instruction '${spec.mnemonic}' expects ${spec.operands.length} operand(s), but received ${operandTexts.length}.`,
      line: source.line,
      column: source.column,
      severity: 'error',
    });
    return { operands, diagnostics };
  }

  for (let i = 0; i < spec.operands.length; i++) {
    const expectedKind = spec.operands[i];
    const rawOp = operandTexts[i];

    switch (expectedKind) {
      case 'register': {
        if (rawOp.startsWith('[') || rawOp.endsWith(']')) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' operand ${i + 1} expects a register (A, B, C, D), got memory address '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (parseNumberLiteral(rawOp).value !== null) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' operand ${i + 1} expects a register (A, B, C, D), got numeric literal '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else {
          const upper = rawOp.toUpperCase();
          if (upper === 'PC' || upper === 'SP' || upper === 'IR') {
            diagnostics.push({
              code: 'INVALID_REGISTER',
              message: `Special register '${upper}' cannot be used as a general-purpose register operand in '${spec.mnemonic}'.`,
              line: source.line,
              severity: 'error',
            });
          } else if (!isRegisterName(rawOp)) {
            diagnostics.push({
              code: 'INVALID_REGISTER',
              message: `Invalid register '${rawOp}'. Expected one of: A, B, C, D.`,
              line: source.line,
              severity: 'error',
            });
          } else {
            operands.push({
              type: 'register',
              register: upper as RegisterName,
            });
          }
        }
        break;
      }

      case 'immediate': {
        if (rawOp.startsWith('[') || rawOp.endsWith(']')) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' operand ${i + 1} expects an immediate value, got memory address '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (isRegisterName(rawOp)) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' operand ${i + 1} expects an immediate value, got register '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else {
          const parsedNum = parseNumberLiteral(rawOp);
          if (parsedNum.value === null) {
            diagnostics.push({
              code: 'INVALID_NUMBER_FORMAT',
              message: `Invalid immediate value '${rawOp}'. Immediate values must be decimal or hexadecimal integers (e.g. 42 or 0x2A).`,
              line: source.line,
              severity: 'error',
            });
          } else if (parsedNum.value < 0 || parsedNum.value > 255) {
            diagnostics.push({
              code: 'VALUE_OUT_OF_RANGE',
              message: `Immediate value ${parsedNum.value} is out of 8-bit range (0 to 255).`,
              line: source.line,
              severity: 'error',
            });
          } else {
            operands.push({
              type: 'immediate',
              value: parsedNum.value,
            });
          }
        }
        break;
      }

      case 'address': {
        const hasOpen = rawOp.includes('[');
        const hasClose = rawOp.includes(']');
        const trimmed = rawOp.trim();

        if (!hasOpen && !hasClose) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' expects memory address enclosed in brackets (e.g. [${rawOp}]), got '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
          diagnostics.push({
            code: 'MALFORMED_BRACKETS',
            message: `Malformed memory address '${rawOp}'. Must start with '[' and end with ']'.`,
            line: source.line,
            severity: 'error',
          });
        } else {
          const inner = trimmed.slice(1, -1).trim();
          if (inner.length === 0) {
            diagnostics.push({
              code: 'MALFORMED_BRACKETS',
              message: `Empty memory address brackets '[]'.`,
              line: source.line,
              severity: 'error',
            });
          } else {
            const parsedNum = parseNumberLiteral(inner);
            if (parsedNum.value === null) {
              diagnostics.push({
                code: 'INVALID_NUMBER_FORMAT',
                message: `Invalid memory address '${inner}'. Address must be decimal or hexadecimal integer (0 to 255).`,
                line: source.line,
                severity: 'error',
              });
            } else if (parsedNum.value < 0 || parsedNum.value > 255) {
              diagnostics.push({
                code: 'VALUE_OUT_OF_RANGE',
                message: `Memory address ${parsedNum.value} is out of 8-bit range (0 to 255).`,
                line: source.line,
                severity: 'error',
              });
            } else {
              operands.push({
                type: 'address',
                address: parsedNum.value,
              });
            }
          }
        }
        break;
      }

      case 'label': {
        if (rawOp.startsWith('[') || rawOp.endsWith(']')) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' expects a label target, got memory address '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (isRegisterName(rawOp)) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' expects a label target, got register '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (parseNumberLiteral(rawOp).value !== null) {
          diagnostics.push({
            code: 'INVALID_OPERAND_TYPE',
            message: `Instruction '${spec.mnemonic}' expects a label target, got numeric literal '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else if (!isValidLabelIdentifier(rawOp)) {
          diagnostics.push({
            code: 'INVALID_LABEL_SYNTAX',
            message: `Invalid label identifier '${rawOp}'.`,
            line: source.line,
            severity: 'error',
          });
        } else {
          operands.push({
            type: 'label',
            label: rawOp,
          });
        }
        break;
      }
    }
  }

  return { operands, diagnostics };
}
