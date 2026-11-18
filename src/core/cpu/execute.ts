/**
 * BL-8 Instruction Execution Dispatcher
 * Executes individual instructions against registers, ALU, memory, stack, and output.
 * Produces authoritative ALU operation and CPU datapath flow highlights.
 */

import {
  AddressOperand,
  ImmediateOperand,
  Instruction,
  LabelOperand,
  RegisterOperand,
} from '../types/instruction.types';
import {
  AluOperationMetadata,
  CpuFlags,
  CpuFlowHighlight,
  CpuRuntimeError,
} from '../types/cpu.types';
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
  aluOperation?: AluOperationMetadata;
  flowHighlight?: CpuFlowHighlight;
}

export function executeInstruction(
  instruction: Instruction,
  ctx: ExecutionContext
): ExecutionResult {
  const { registers, memory, output } = ctx;
  let flags = { ...ctx.flags };
  let stackDepth = ctx.stackDepth;
  let aluOperation: AluOperationMetadata | undefined;
  let flowHighlight: CpuFlowHighlight | undefined;

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

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `Register ${srcOp.register} (${value}) copied to Register ${destOp.register}`,
      };
      break;
    }

    case 'LDI': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const immOp = instruction.operands[1] as ImmediateOperand;
      registers.set(destOp.register, immOp.value);

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank'],
        activeRegisters: [destOp.register],
        activePathDescription: `Immediate ${immOp.value} (0x${immOp.value.toString(16).toUpperCase()}) loaded into Register ${destOp.register}`,
      };
      break;
    }

    case 'LOAD': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const addrOp = instruction.operands[1] as AddressOperand;
      const value = memory.readData(addrOp.address);
      registers.set(destOp.register, value);

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'dataMemory', 'registerBank'],
        activeRegisters: [destOp.register],
        activeDataAddress: addrOp.address,
        activePathDescription: `RAM[0x${addrOp.address.toString(16).toUpperCase()}] (${value}) loaded into Register ${destOp.register}`,
      };
      break;
    }

    case 'STORE': {
      const addrOp = instruction.operands[0] as AddressOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const value = registers.get(srcOp.register);
      memory.writeData(addrOp.address, value);

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'dataMemory'],
        activeRegisters: [srcOp.register],
        activeDataAddress: addrOp.address,
        activePathDescription: `Register ${srcOp.register} (${value}) stored into RAM[0x${addrOp.address.toString(16).toUpperCase()}]`,
      };
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

      aluOperation = {
        operation: 'ADD',
        leftOperand: a,
        rightOperand: b,
        result: res.result,
        carryBorrow: res.flags.C,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: ADD ${destOp.register}(${a}) + ${srcOp.register}(${b}) = ${res.result}`,
      };
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

      aluOperation = {
        operation: 'SUB',
        leftOperand: a,
        rightOperand: b,
        result: res.result,
        carryBorrow: res.flags.C,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: SUB ${destOp.register}(${a}) - ${srcOp.register}(${b}) = ${res.result}`,
      };
      break;
    }

    case 'INC': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.inc(a, flags.C);
      registers.set(destOp.register, res.result);
      flags = res.flags;

      aluOperation = {
        operation: 'INC',
        leftOperand: a,
        result: res.result,
        carryBorrow: res.flags.C,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register],
        activePathDescription: `ALU: INC ${destOp.register}(${a}) -> ${res.result}`,
      };
      break;
    }

    case 'DEC': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.dec(a, flags.C);
      registers.set(destOp.register, res.result);
      flags = res.flags;

      aluOperation = {
        operation: 'DEC',
        leftOperand: a,
        result: res.result,
        carryBorrow: res.flags.C,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register],
        activePathDescription: `ALU: DEC ${destOp.register}(${a}) -> ${res.result}`,
      };
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

      aluOperation = {
        operation: 'AND',
        leftOperand: a,
        rightOperand: b,
        result: res.result,
        carryBorrow: false,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: AND ${destOp.register}(${a}) & ${srcOp.register}(${b}) = ${res.result}`,
      };
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

      aluOperation = {
        operation: 'OR',
        leftOperand: a,
        rightOperand: b,
        result: res.result,
        carryBorrow: false,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: OR ${destOp.register}(${a}) | ${srcOp.register}(${b}) = ${res.result}`,
      };
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

      aluOperation = {
        operation: 'XOR',
        leftOperand: a,
        rightOperand: b,
        result: res.result,
        carryBorrow: false,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: XOR ${destOp.register}(${a}) ^ ${srcOp.register}(${b}) = ${res.result}`,
      };
      break;
    }

    case 'NOT': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const a = registers.get(destOp.register);
      const res = Alu.not(a);
      registers.set(destOp.register, res.result);
      flags = res.flags;

      aluOperation = {
        operation: 'NOT',
        leftOperand: a,
        result: res.result,
        carryBorrow: false,
        flags: res.flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register],
        activePathDescription: `ALU: NOT ~${destOp.register}(${a}) = ${res.result}`,
      };
      break;
    }

    case 'CMP': {
      const destOp = instruction.operands[0] as RegisterOperand;
      const srcOp = instruction.operands[1] as RegisterOperand;
      const a = registers.get(destOp.register);
      const b = registers.get(srcOp.register);
      flags = Alu.cmp(a, b);

      aluOperation = {
        operation: 'CMP',
        leftOperand: a,
        rightOperand: b,
        result: (a - b + 256) & 0xff,
        carryBorrow: flags.C,
        flags,
      };

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'alu'],
        activeRegisters: [destOp.register, srcOp.register],
        activePathDescription: `ALU: CMP ${destOp.register}(${a}) vs ${srcOp.register}(${b}) -> Flags: Z=${flags.Z ? 1 : 0}, C=${flags.C ? 1 : 0}, N=${flags.N ? 1 : 0}`,
      };
      break;
    }

    case 'JMP': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const targetRes = getJumpTarget(labelOp);
      if ('error' in targetRes) {
        return { flags, stackDepth, error: targetRes.error };
      }
      registers.setPC(targetRes.target);

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
        activeRegisters: [],
        activePathDescription: `Unconditional Jump to '${labelOp.label}' (PC = ${targetRes.target})`,
      };
      break;
    }

    case 'JZ': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const taken = flags.Z;
      if (taken) {
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
        activeRegisters: [],
        activePathDescription: `JZ '${labelOp.label}': ${taken ? 'Taken (Z=1)' : 'Not Taken (Z=0)'}`,
      };
      break;
    }

    case 'JNZ': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const taken = !flags.Z;
      if (taken) {
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
        activeRegisters: [],
        activePathDescription: `JNZ '${labelOp.label}': ${taken ? 'Taken (Z=0)' : 'Not Taken (Z=1)'}`,
      };
      break;
    }

    case 'JC': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const taken = flags.C;
      if (taken) {
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
        activeRegisters: [],
        activePathDescription: `JC '${labelOp.label}': ${taken ? 'Taken (C=1)' : 'Not Taken (C=0)'}`,
      };
      break;
    }

    case 'JN': {
      const labelOp = instruction.operands[0] as LabelOperand;
      const taken = flags.N;
      if (taken) {
        const targetRes = getJumpTarget(labelOp);
        if ('error' in targetRes) {
          return { flags, stackDepth, error: targetRes.error };
        }
        registers.setPC(targetRes.target);
      }

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
        activeRegisters: [],
        activePathDescription: `JN '${labelOp.label}': ${taken ? 'Taken (N=1)' : 'Not Taken (N=0)'}`,
      };
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

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'dataMemory'],
        activeRegisters: [srcOp.register],
        activeDataAddress: currentSP,
        activePathDescription: `Pushed Register ${srcOp.register} (${value}) to Stack RAM[0x${currentSP.toString(16).toUpperCase()}]; SP decremented`,
      };
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

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'dataMemory', 'registerBank'],
        activeRegisters: [destOp.register],
        activeDataAddress: newSP,
        activePathDescription: `Popped Stack RAM[0x${newSP.toString(16).toUpperCase()}] (${value}) into Register ${destOp.register}; SP incremented`,
      };
      break;
    }

    case 'OUT': {
      const srcOp = instruction.operands[0] as RegisterOperand;
      const value = registers.get(srcOp.register);
      output.push(value);

      flowHighlight = {
        activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit', 'registerBank', 'output'],
        activeRegisters: [srcOp.register],
        activePathDescription: `Register ${srcOp.register} (${value}) sent to Output port`,
      };
      break;
    }

    case 'HLT': {
      return {
        flags,
        stackDepth,
        halted: true,
        flowHighlight: {
          activeComponents: ['pc', 'programMemory', 'ir', 'controlUnit'],
          activeRegisters: [],
          activePathDescription: 'CPU Halted (HLT)',
        },
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

  return { flags, stackDepth, aluOperation, flowHighlight };
}
