/**
 * Resolver & Symbol Linker for BL-8 Assembly Language
 * Handles symbol table construction, duplicate detection, and label resolution.
 */

import { Instruction } from '../types/instruction.types';
import {
  AssemblerDiagnostic,
  ParsedLabel,
} from '../types/assembler.types';

export interface ResolveSymbolsResult {
  symbolTable: Record<string, number>;
  sourceMap: Record<number, number>;
  diagnostics: AssemblerDiagnostic[];
}

/**
 * Builds the symbol table from parsed labels and resolves label operands in instructions.
 */
export function resolveSymbols(
  parsedLabels: ParsedLabel[],
  instructions: Instruction[]
): ResolveSymbolsResult {
  const diagnostics: AssemblerDiagnostic[] = [];
  const symbolTable: Record<string, number> = {};
  const caseInsensitiveLabels = new Map<
    string,
    { originalName: string; address: number; line: number }
  >();

  // Pass 1: Build symbol table and detect duplicate labels
  for (const label of parsedLabels) {
    const lowerName = label.name.toLowerCase();
    const existing = caseInsensitiveLabels.get(lowerName);

    if (existing) {
      diagnostics.push({
        code: 'DUPLICATE_LABEL',
        message: `Duplicate label '${label.name}' defined on line ${label.source.line}. It was already defined on line ${existing.line}.`,
        line: label.source.line,
        column: label.source.column,
        severity: 'error',
      });
    } else {
      symbolTable[label.name] = label.instructionIndex;
      caseInsensitiveLabels.set(lowerName, {
        originalName: label.name,
        address: label.instructionIndex,
        line: label.source.line,
      });
    }
  }

  // Pass 2: Resolve label operands in instructions
  for (const instruction of instructions) {
    for (const operand of instruction.operands) {
      if (operand.type === 'label') {
        const lowerName = operand.label.toLowerCase();
        const entry = caseInsensitiveLabels.get(lowerName);

        if (entry !== undefined) {
          operand.resolvedAddress = entry.address;
        } else {
          diagnostics.push({
            code: 'UNDEFINED_LABEL',
            message: `Undefined label '${operand.label}' referenced by instruction '${instruction.mnemonic}'.`,
            line: instruction.source.line,
            column: instruction.source.column,
            severity: 'error',
          });
        }
      }
    }
  }

  // Pass 3: Validate program instruction limit (maximum 256 instruction slots)
  if (instructions.length > 256) {
    diagnostics.push({
      code: 'PROGRAM_TOO_LARGE',
      message: `Program contains ${instructions.length} instructions, exceeding the maximum program memory capacity of 256 instructions (addresses 0 to 255).`,
      line: instructions[256]?.source.line || instructions[instructions.length - 1].source.line,
      severity: 'error',
    });
  }

  // Pass 4: Build source line mapping (instruction slot index -> source line)
  const sourceMap: Record<number, number> = {};
  for (const instruction of instructions) {
    sourceMap[instruction.address] = instruction.source.line;
  }

  return {
    symbolTable,
    sourceMap,
    diagnostics,
  };
}
