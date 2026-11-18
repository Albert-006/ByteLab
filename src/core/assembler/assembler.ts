/**
 * BL-8 Main Assembler
 * Orchestrates normalization, parsing, operand validation, and symbol resolution.
 */

import {
  ALL_MNEMONICS,
  Instruction,
  OpcodeMnemonic,
} from '../types/instruction.types';
import {
  AssemblerDiagnostic,
  AssemblyResult,
} from '../types/assembler.types';
import { normalizeSource } from './lexer';
import {
  INSTRUCTION_SPECS,
  parseFirstPass,
  parseOperandsForInstruction,
} from './parser';
import { resolveSymbols } from './resolver';

/**
 * Assembles BL-8 assembly source code into intermediate instruction representations.
 * Never throws for user syntax errors; always returns structured diagnostics.
 */
export function assemble(sourceCode: string): AssemblyResult {
  const diagnostics: AssemblerDiagnostic[] = [];

  // Step 1: Normalize source lines and strip comments
  const rawLines = normalizeSource(sourceCode);

  // Step 2: First pass - extract labels and instruction lines
  const firstPass = parseFirstPass(rawLines);
  diagnostics.push(...firstPass.diagnostics);

  // Step 3: Parse and validate each instruction line
  const instructions: Instruction[] = [];

  for (const parsedLine of firstPass.parsedLines) {
    const upperMnemonic = parsedLine.mnemonicText.toUpperCase() as OpcodeMnemonic;

    if (!ALL_MNEMONICS.includes(upperMnemonic)) {
      diagnostics.push({
        code: 'UNKNOWN_MNEMONIC',
        message: `Unknown instruction mnemonic '${parsedLine.mnemonicText}'.`,
        line: parsedLine.source.line,
        column: parsedLine.source.column,
        severity: 'error',
      });
      continue;
    }

    const spec = INSTRUCTION_SPECS[upperMnemonic];
    const operandResult = parseOperandsForInstruction(parsedLine, spec);
    diagnostics.push(...operandResult.diagnostics);

    instructions.push({
      address: parsedLine.instructionIndex,
      mnemonic: spec.mnemonic,
      opcode: spec.opcode,
      operands: operandResult.operands,
      source: parsedLine.source,
    });
  }

  // Step 4: Resolve labels, detect duplicate/undefined labels, and check limits
  const resolveResult = resolveSymbols(firstPass.parsedLabels, instructions);
  diagnostics.push(...resolveResult.diagnostics);

  // Step 5: Sort diagnostics by line number and column
  diagnostics.sort((a, b) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return (a.column ?? 0) - (b.column ?? 0);
  });

  const hasErrors = diagnostics.some((d) => d.severity === 'error');

  return {
    success: !hasErrors,
    instructions: hasErrors ? [] : instructions,
    diagnostics,
    symbolTable: resolveResult.symbolTable,
    sourceMap: resolveResult.sourceMap,
  };
}
