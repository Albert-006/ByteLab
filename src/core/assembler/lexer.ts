/**
 * Lexer & Source Normalization for BL-8 Assembly Language
 */

import { RawSourceLine } from '../types/assembler.types';

/**
 * Normalizes input assembly text into lines, stripping comments while
 * preserving original 1-based line numbers and raw source lines.
 */
export function normalizeSource(sourceText: string): RawSourceLine[] {
  const lines = sourceText.split(/\r?\n/);
  return lines.map((rawText, index) => {
    const lineNumber = index + 1;
    // Strip comments starting from ';' to end of line
    const commentIndex = rawText.indexOf(';');
    const textWithoutComment = commentIndex !== -1 ? rawText.slice(0, commentIndex) : rawText;
    const sanitizedText = textWithoutComment.trim();

    return {
      lineNumber,
      rawText,
      sanitizedText,
    };
  });
}

/**
 * Helper to split operand string by commas while respecting potential brackets
 */
export function splitOperands(operandsStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inBrackets = false;

  for (let i = 0; i < operandsStr.length; i++) {
    const char = operandsStr[i];
    if (char === '[') {
      inBrackets = true;
      current += char;
    } else if (char === ']') {
      inBrackets = false;
      current += char;
    } else if (char === ',' && !inBrackets) {
      if (current.trim().length > 0 || current.length > 0) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Parse a numeric literal string (decimal or hex e.g. 0x2A) into an integer.
 * Returns null if invalid.
 */
export function parseNumberLiteral(token: string): { value: number | null; error?: string } {
  const trimmed = token.trim();
  if (trimmed === '') {
    return { value: null, error: 'Empty numeric value' };
  }

  // Hexadecimal notation: 0x... or 0X...
  if (/^0[xX][0-9a-fA-F]+$/.test(trimmed)) {
    const val = parseInt(trimmed, 16);
    return { value: val };
  }

  // Decimal notation: optional sign, digits
  if (/^[+-]?\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    return { value: val };
  }

  return { value: null, error: `Invalid number format: '${token}'` };
}

/**
 * Check if a string is a valid identifier (for labels)
 */
export function isValidLabelIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
