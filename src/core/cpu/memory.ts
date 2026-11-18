/**
 * BL-8 Memory Architecture
 * Manages separate Program Memory (256 instruction slots) and Data Memory (256 bytes).
 */

import { Instruction } from '../types/instruction.types';

export class Memory {
  // 256 bytes of Data Memory (RAM)
  private dataMemory: Uint8Array = new Uint8Array(256);

  // 256 instruction slots of Program Memory
  private programMemory: (Instruction | null)[] = new Array(256).fill(null);

  // Loaded instruction count
  private loadedCount: number = 0;

  public reset(): void {
    this.dataMemory.fill(0);
  }

  public clearAll(): void {
    this.dataMemory.fill(0);
    this.programMemory.fill(null);
    this.loadedCount = 0;
  }

  public loadProgram(instructions: Instruction[]): void {
    this.programMemory.fill(null);
    this.loadedCount = instructions.length;

    for (let i = 0; i < instructions.length && i < 256; i++) {
      this.programMemory[i] = { ...instructions[i] };
    }
  }

  public getInstruction(slot: number): Instruction | null {
    if (slot < 0 || slot >= 256) {
      return null;
    }
    return this.programMemory[slot];
  }

  public getLoadedProgramLength(): number {
    return this.loadedCount;
  }

  public readData(address: number): number {
    const safeAddr = address & 0xff;
    return this.dataMemory[safeAddr];
  }

  public writeData(address: number, value: number): void {
    const safeAddr = address & 0xff;
    this.dataMemory[safeAddr] = value & 0xff;
  }

  public cloneData(): number[] {
    return Array.from(this.dataMemory);
  }

  public cloneProgram(): (Instruction | null)[] {
    return this.programMemory.map((instr) => (instr ? { ...instr } : null));
  }
}
