/**
 * BL-8 CPU Flag Helpers
 */

import { CpuFlags } from '../types/cpu.types';

export function createInitialFlags(): CpuFlags {
  return {
    Z: false,
    C: false,
    N: false,
  };
}

export function cloneFlags(flags: CpuFlags): CpuFlags {
  return { ...flags };
}

export function isZero(value: number): boolean {
  return (value & 0xff) === 0;
}

export function isNegative(value: number): boolean {
  return (value & 0x80) !== 0;
}
