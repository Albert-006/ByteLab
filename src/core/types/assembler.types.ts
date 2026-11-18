/**
 * Assembler Diagnostics, Intermediate Tokens, and Assembly Result Types
 */

import { Instruction, SourceLocation } from './instruction.types';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type DiagnosticCode =
  | 'DUPLICATE_LABEL'
  | 'UNDEFINED_LABEL'
  | 'INVALID_LABEL_SYNTAX'
  | 'UNKNOWN_MNEMONIC'
  | 'INVALID_OPERAND_COUNT'
  | 'INVALID_OPERAND_TYPE'
  | 'INVALID_REGISTER'
  | 'MALFORMED_BRACKETS'
  | 'INVALID_NUMBER_FORMAT'
  | 'VALUE_OUT_OF_RANGE'
  | 'PROGRAM_TOO_LARGE'
  | 'SYNTAX_ERROR';

export interface AssemblerDiagnostic {
  code: DiagnosticCode;
  message: string;
  line: number; // 1-based line number in source
  column?: number; // 1-based column
  severity: DiagnosticSeverity;
}

export interface RawSourceLine {
  lineNumber: number; // 1-based
  rawText: string;
  sanitizedText: string; // comments stripped, trimmed
}

export interface ParsedLabel {
  name: string;
  source: SourceLocation;
  instructionIndex: number; // zero-based target instruction address
}

export interface ParsedInstructionLine {
  instructionIndex: number; // zero-based instruction slot (0 - 255)
  mnemonicText: string;
  operandTexts: string[];
  source: SourceLocation;
}

export interface AssemblyResult {
  success: boolean;
  instructions: Instruction[];
  diagnostics: AssemblerDiagnostic[];
  symbolTable: Record<string, number>; // label -> instruction slot index
  sourceMap: Record<number, number>; // instruction slot index -> 1-based source line
}
