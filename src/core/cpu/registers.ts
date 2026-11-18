/**
 * BL-8 Register Management
 */

import { RegisterName, Instruction } from '../types/instruction.types';
import { RegisterFile, SpecialRegisterFile } from '../types/cpu.types';

export class Registers {
  private general: RegisterFile = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  private pc: number = 0;
  private sp: number = 255;
  private ir: Instruction | null = null;

  public reset(): void {
    this.general = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    };
    this.pc = 0;
    this.sp = 255;
    this.ir = null;
  }

  public get(name: RegisterName): number {
    return this.general[name];
  }

  public set(name: RegisterName, value: number): void {
    this.general[name] = value & 0xff;
  }

  public getPC(): number {
    return this.pc;
  }

  public setPC(value: number): void {
    this.pc = value & 0xff;
  }

  public incrementPC(): void {
    this.pc = (this.pc + 1) & 0xff;
  }

  public getSP(): number {
    return this.sp;
  }

  public setSP(value: number): void {
    this.sp = value & 0xff;
  }

  public getIR(): Instruction | null {
    return this.ir;
  }

  public setIR(instruction: Instruction | null): void {
    this.ir = instruction;
  }

  public cloneGeneral(): RegisterFile {
    return { ...this.general };
  }

  public cloneSpecial(): SpecialRegisterFile {
    return {
      PC: this.pc,
      SP: this.sp,
      IR: this.ir ? { ...this.ir } : null,
    };
  }
}
