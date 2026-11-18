/**
 * BL-8 Arithmetic Logic Unit (ALU)
 * Implements 8-bit arithmetic, logic, and comparison operations with flag updates.
 */

import { CpuFlags } from '../types/cpu.types';
import { isNegative, isZero } from './flags';

export interface AluResult {
  result: number; // 0 - 255
  flags: CpuFlags;
}

export class Alu {
  /**
   * 8-bit Addition: dest + src
   * Updates Z, C, N. C is set on unsigned overflow > 255.
   */
  public static add(a: number, b: number): AluResult {
    const sum = (a & 0xff) + (b & 0xff);
    const result = sum & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: sum > 255,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Subtraction: dest - src
   * Updates Z, C, N. C is set on borrow (dest < src).
   */
  public static sub(a: number, b: number): AluResult {
    const left = a & 0xff;
    const right = b & 0xff;
    const diff = left - right;
    const result = (diff + 256) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: left < right,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Increment: reg + 1
   * Updates Z, N. C is preserved.
   */
  public static inc(a: number, currentCarry: boolean): AluResult {
    const result = ((a & 0xff) + 1) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: currentCarry,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Decrement: reg - 1
   * Updates Z, N. C is preserved.
   */
  public static dec(a: number, currentCarry: boolean): AluResult {
    const result = ((a & 0xff) - 1 + 256) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: currentCarry,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Bitwise AND: dest & src
   * Updates Z, N. C is cleared (false).
   */
  public static and(a: number, b: number): AluResult {
    const result = ((a & 0xff) & (b & 0xff)) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: false,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Bitwise OR: dest | src
   * Updates Z, N. C is cleared (false).
   */
  public static or(a: number, b: number): AluResult {
    const result = ((a & 0xff) | (b & 0xff)) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: false,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Bitwise XOR: dest ^ src
   * Updates Z, N. C is cleared (false).
   */
  public static xor(a: number, b: number): AluResult {
    const result = ((a & 0xff) ^ (b & 0xff)) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: false,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Bitwise NOT: ~dest
   * Updates Z, N. C is cleared (false).
   */
  public static not(a: number): AluResult {
    const result = (~(a & 0xff)) & 0xff;
    return {
      result,
      flags: {
        Z: isZero(result),
        C: false,
        N: isNegative(result),
      },
    };
  }

  /**
   * 8-bit Comparison: dest - src without saving result
   * Updates Z, C, N. C is set on borrow (dest < src).
   */
  public static cmp(a: number, b: number): CpuFlags {
    const subResult = Alu.sub(a, b);
    return subResult.flags;
  }
}
