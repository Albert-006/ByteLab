/**
 * BL-8 Architecture Instruction and Register Type Definitions
 */

export type RegisterName = 'A' | 'B' | 'C' | 'D';
export type SpecialRegisterName = 'PC' | 'SP' | 'IR';
export type FlagName = 'Z' | 'C' | 'N';

export const REGISTER_NAMES: readonly RegisterName[] = ['A', 'B', 'C', 'D'] as const;

export function isRegisterName(value: string): value is RegisterName {
  const upper = value.toUpperCase();
  return REGISTER_NAMES.includes(upper as RegisterName);
}

export type OpcodeMnemonic =
  | 'MOV'
  | 'LDI'
  | 'LOAD'
  | 'STORE'
  | 'ADD'
  | 'SUB'
  | 'INC'
  | 'DEC'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'NOT'
  | 'CMP'
  | 'JMP'
  | 'JZ'
  | 'JNZ'
  | 'JC'
  | 'JN'
  | 'PUSH'
  | 'POP'
  | 'OUT'
  | 'HLT';

export const ALL_MNEMONICS: readonly OpcodeMnemonic[] = [
  'MOV',
  'LDI',
  'LOAD',
  'STORE',
  'ADD',
  'SUB',
  'INC',
  'DEC',
  'AND',
  'OR',
  'XOR',
  'NOT',
  'CMP',
  'JMP',
  'JZ',
  'JNZ',
  'JC',
  'JN',
  'PUSH',
  'POP',
  'OUT',
  'HLT',
] as const;

export const OPCODES: Record<OpcodeMnemonic, number> = {
  MOV: 0x01,
  LDI: 0x02,
  LOAD: 0x03,
  STORE: 0x04,
  ADD: 0x10,
  SUB: 0x11,
  INC: 0x12,
  DEC: 0x13,
  AND: 0x20,
  OR: 0x21,
  XOR: 0x22,
  NOT: 0x23,
  CMP: 0x30,
  JMP: 0x31,
  JZ: 0x32,
  JNZ: 0x33,
  JC: 0x34,
  JN: 0x35,
  PUSH: 0x40,
  POP: 0x41,
  OUT: 0x42,
  HLT: 0xff,
} as const;

export type RegisterOperand = {
  type: 'register';
  register: RegisterName;
};

export type ImmediateOperand = {
  type: 'immediate';
  value: number; // 0 - 255
};

export type AddressOperand = {
  type: 'address';
  address: number; // 0 - 255
};

export type LabelOperand = {
  type: 'label';
  label: string;
  resolvedAddress?: number; // 0 - 255 once resolved
};

export type Operand =
  | RegisterOperand
  | ImmediateOperand
  | AddressOperand
  | LabelOperand;

export interface SourceLocation {
  line: number; // 1-based line number in original source
  column: number; // 1-based column number
  text: string; // original line or token text
}

export interface Instruction {
  address: number; // 0 to 255 slot index in program memory
  mnemonic: OpcodeMnemonic;
  opcode: number;
  operands: Operand[];
  source: SourceLocation;
}
