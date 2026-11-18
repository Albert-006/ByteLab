/**
 * BL-8 Instruction Execution Dispatcher
 * Executes individual instructions against registers, ALU, memory, stack, and output.
 */

import {
  AddressOperand,
  ImmediateOperand,
  Instruction,
  LabelOperand,
  RegisterOperand,
} from '../types/instruction.types';
import { CpuFlags, CpuRuntimeError } from '../types/cpu.types';
import { Alu } from './alu';
import { Memory } from './memory';
import { Registers } from './registers';

export interface ExecutionContext {
  registers: Registers;
  memory: Memory;
  flags: CpuFlags;
  output: number[];
  stackDepth: number;
}

export interface ExecutionResult {
  flags: CpuFlags;
  stackDepth: number;
  halted?: boolean;
  error?: CpuRuntimeError;
}

export function executeInstruction(
  instruction: Instruction,
  ctx: ExecutionContext
): ExecutionResult {
  const { registers, memory, output } = ctx;
  let flags = { ...ctx.flags };
  let stackDepth = ctx.stackDepth;

  const getJumpTarget = (op: LabelOperand): { target: number } | { error: CpuRuntimeError } => {
    if (op.resolvedAddress === undefined) {
      return {
        error: {
          code: 'UNRESOLVED_LABEL',
          message: `Label '${op.label}' was not resolved to an instruction address.`,
          pc: registers.getPC(),
        },
      };
    }
    if (op.resolvedAddress < 0 || op.resolvedAddress >= 256) {
      return {
        error: {
          code: 'PROGRAM_COUNTER_OUT_OF_BOUNDS',
          message: `Jump target ${op.resolvedAddress} for label '${op.label}' is out of program bounds (0 to 255).`,
          pc: registers.getPC(),
        },
      };
    }
    return { target: op.resolvedAddress };
  };

  switch (instruction.mnemonic) {
    case 'MOV': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const value = registers.get(srcOp.register);
      registers.set(destOp.register, value);
      break;
    }

    case 'LDI': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const immOp = instruction.operands[1] as ImmediateOperand;
      registers.set(destOp.register, immOp.value);
      break;
    }

    case 'LOAD': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const addrOp = instruction.operands[1] as AddressOperand;
      const value = memory.readData(addrOp.address);
      registers.set(destOp.register, value);
      break;
    }

    case 'STORE': {
      const addrOp = instruction.operands[0] as AddressOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const value = registers.get(srcOp.register);
      memory.writeData(addrOp.address, value);
      break;
    }

    case 'ADD': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      const res = Alu.add(a, b);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'SUB': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      const res = Alu.sub(a, b);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'INC': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.inc(a, flags.C);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'DEC': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.dec(a, flags.C);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'AND': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      const res = Alu.and(a, b);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'OR': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      const res = Alu.or(a, b);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'XOR': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      const res = Alu.xor(a, b);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'NOT': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.not(a);
      registers.set(destOp.register, res.result);
      flags = res.flags;
      break;
    }

    case 'CMP': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      flags = Alu.cmp(a, b);
      break;
    }

    case 'JMP': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const targetRes = getJumpTarget(labelOp);
      if ('error' in targetRes) {
        return { flags, stackDepth, error: targetRes.error };
      }
      registers.setPC(targetRes.target);
      break;
    }

    case 'JZ': {
      if (flags.Z) {
        const labelOp = instruction.operands[0] as LabelOperand;
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }
      break;
    }

    case 'JNZ': {
      if (!flags.Z) {
        const labelOp = instruction.operands[0] as LabelOperand;
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }
      break;
    }

    case 'JC': {
      if (flags.C) {
        const labelOp = instruction.operands[0] as LabelOperand;
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }
      break;
    }

    case 'JN': {
      if (flags.N) {
        const labelOp = instruction.operands[0] as LabelOperand;
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }
      break;
    }

    case 'PUSH': {
      if (stackDepth >= 256) {
        return {
          flags,
          stackDepth,
          error: {
            code: 'STACK_OVERFLOW',
            message: `Stack overflow: cannot push value onto stack exceeding maximum capacity of 256 bytes.`,
            pc: registers.getPC(),
          },
        };
      }
      const srcOp = instruction.operands[0] as RegisterOperand;
      const value = registers.get(srcOp.register);
      const currentSP = registers.getSP();
      memory.writeData(currentSP, value);
      registers.setSP((currentSP - 1 + 256) & 0xff);
      stackDepth++;
      break;
    }

    case 'POP': {
      if (stackDepth <= 0 || registers.getSP() === 255) {
        return {
          flags,
          stackDepth,
          error: {
            code: 'STACK_UNDERFLOW',
            message: `Stack underflow: cannot pop from an empty stack (SP = 255).`,
            pc: registers.getPC(),
          },
        };
      }
      const destOp = instruction.operands[0] as RegisterOperand;
      const newSP = (registers.getSP() + 1) & 0xff;
      registers.setSP(newSP);
      const value = memory.readData(newSP);
      registers.set(destOp.register, value);
      stackDepth--;
      break;
    }

    case 'OUT': {
      const srcOp = instruction.operands[0] as RegisterOperand;
      const value = registers.get(srcOp.register);
      output.push(value);
      break;
    }

    case 'HLT': {
      return {
        flags,
        stackDepth,
        halted: true,
      };
    }

    default: {
      return {
        flags,
        stackDepth,
        error: {
          code: 'INVALID_INSTRUCTION',
          message: `Unknown or unhandled instruction mnemonic '${(instruction as Instruction).mnemonic}'.`,
          pc: registers.getPC(),
        },
      };
    }
  }

  return { flags, stackDepth };
}
