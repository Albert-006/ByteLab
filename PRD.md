# ByteLab Product Requirements Document (PRD)

## 1. Overview
ByteLab is an interactive, browser-based educational 8-bit CPU simulator designed to help students, developers, and educators understand computer architecture fundamentals through hands-on assembly programming, visual register tracking, memory inspection, and micro-operation tracing.

## 2. Core Architecture: BL-8 Specification
- **Data Width**: 8-bit (values 0–255 unsigned, two's complement -128 to 127).
- **Address Width**: 8-bit (addresses 0–255).
- **Registers**:
  - **General-Purpose Registers (8-bit)**: `A`, `B`, `C`, `D`.
  - **Special-Purpose Registers**:
    - `PC` (Program Counter, 8-bit): Points to the current instruction in program memory (0–255).
    - `SP` (Stack Pointer, 8-bit): Points to top of stack in data memory (initialized to 255, grows downwards).
    - `IR` (Instruction Register): Holds the currently executing instruction.
  - **Flags (Status Register)**:
    - `Z` (Zero Flag): Set when an arithmetic, logical, or comparison operation evaluates to zero.
    - `C` (Carry/Borrow Flag): Set on arithmetic carry-out or borrow.
    - `N` (Negative Flag): Set when MSB (bit 7) of an operation result is 1.
- **Memory Architecture**:
  - Harvard-style separation:
    - **Program Memory**: 256 instruction slots (index 0 to 255). Each slot holds one instruction representation.
    - **Data Memory (RAM)**: 256 bytes (0x00 to 0xFF).
- **Initial Machine State**:
  - `A = 0`, `B = 0`, `C = 0`, `D = 0`.
  - `PC = 0`.
  - `SP = 255` (0xFF).
  - `Z = 0`, `C = 0`, `N = 0`.
  - Data memory zero-initialized.

## 3. Instruction Set (21 Instructions)

| Category | Mnemonic | Syntax | Opcode / Hex | Description |
|---|---|---|---|---|
| **Data Movement** | `MOV` | `MOV reg, reg` | 0x01 | Copy value from source register to destination register. |
| | `LDI` | `LDI reg, imm` | 0x02 | Load 8-bit immediate value into register. |
| | `LOAD` | `LOAD reg, [addr]` | 0x03 | Load value from data memory at address into register. |
| | `STORE` | `STORE [addr], reg` | 0x04 | Store value from register into data memory at address. |
| **Arithmetic** | `ADD` | `ADD reg, reg` | 0x10 | Add source register to destination register. Updates Z, C, N. |
| | `SUB` | `SUB reg, reg` | 0x11 | Subtract source register from dest register. Updates Z, C, N. |
| | `INC` | `INC reg` | 0x12 | Increment register by 1 (modulo 256). Updates Z, N (C unaffected). |
| | `DEC` | `DEC reg` | 0x13 | Decrement register by 1 (modulo 256). Updates Z, N (C unaffected). |
| **Logical** | `AND` | `AND reg, reg` | 0x20 | Bitwise AND between destination and source. Updates Z, N. C cleared. |
| | `OR` | `OR reg, reg` | 0x21 | Bitwise OR between destination and source. Updates Z, N. C cleared. |
| | `XOR` | `XOR reg, reg` | 0x22 | Bitwise XOR between destination and source. Updates Z, N. C cleared. |
| | `NOT` | `NOT reg` | 0x23 | Bitwise NOT (one's complement) of register. Updates Z, N. |
| **Control Flow** | `CMP` | `CMP reg, reg` | 0x30 | Compare registers (performs dest - src, updates Z, C, N without storing result). |
| | `JMP` | `JMP label` | 0x31 | Unconditional jump to target instruction address. |
| | `JZ` | `JZ label` | 0x32 | Jump if Zero flag (Z == 1). |
| | `JNZ` | `JNZ label` | 0x33 | Jump if Not Zero (Z == 0). |
| | `JC` | `JC label` | 0x34 | Jump if Carry flag (C == 1). |
| | `JN` | `JN label` | 0x35 | Jump if Negative flag (N == 1). |
| **Stack & I/O** | `PUSH` | `PUSH reg` | 0x40 | Push register value onto stack (`RAM[SP] = reg; SP--`). |
| | `POP` | `POP reg` | 0x41 | Pop value from stack into register (`SP++; reg = RAM[SP]`). |
| | `OUT` | `OUT reg` | 0x42 | Output register value to console/output port. |
| | `HLT` | `HLT` | 0xFF | Halt processor execution. |

## 4. Assembly Language Syntax
- **Case-Insensitive**: Mnemonics (`MOV`, `mov`) and register names (`A`, `a`) are case-insensitive.
- **Comments**: Start with `;` and continue to end of line.
- **Labels**: Defined as `label:` on their own line or preceding an instruction. Resolve to zero-based instruction slot in program memory.
- **Immediates & Addresses**: Decimal (`42`) or hexadecimal (`0x2A`). Range: `0` to `255` (`0x00` to `0xFF`).
- **Memory References**: Enclosed in square brackets, e.g., `[10]` or `[0x20]`.
- **Limits**: Maximum 256 instructions per program.

## 5. Development Milestones
- **Milestone 1**: BL-8 Architecture Specification, Documentation, and Assembler (Intermediate Representation, Diagnostics, Unit Tests).
- **Milestone 2**: BL-8 CPU Execution Engine (Clock Cycle / Stepping, ALU, Memory Bus, Flag management, Execution history).
- **Milestone 3**: Web Application & Visualizer (Code Editor with diagnostics, Register display, Memory grid, Stepping controls, I/O log).
- **Milestone 4**: Interactive Tutorials, Example Programs, and Polish.

## 6. Constraints & Hosting
- Browser-only, static Vite application deployable to Vercel.
- No backend, no serverless functions, no external database.
- Fully typed in TypeScript with comprehensive Vitest tests.
