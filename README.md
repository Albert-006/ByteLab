# ByteLab (BL-8) — Educational 8-Bit CPU Simulator & Workbench

ByteLab is a browser-based, educational 8-bit CPU simulator, assembly workbench, and visual time-travel debugger designed to make computer architecture and assembly programming intuitive, observable, and engaging.

ByteLab runs entirely in the browser using React, TypeScript, Vite, Tailwind CSS, and Monaco Editor. It requires no backend, database, or external servers, and is fully deployable as a static web application to Vercel.

---

## Workspace Preview

```text
+---------------------------------------------------------------------------------------------------------+
| [Binary] ByteLab - BL-8 CPU Workbench    [Program: Fibonacci]  [Upload/Download]                        |
| [Assemble]  [< Back]  [Step >]  [> Run]  [Reset]  [Speed: 5 Hz]                       [Status: ASSEMBLED] |
+----------------------------------------+----------------------------------------------------------------+
| BL-8 ASSEMBLY EDITOR                   | TIME TRAVEL DEBUGGER: Step 4 / 8          [LIVE EXECUTION HEAD] |
| (Monaco with BL-8 Syntax & BP Gutter)  | [|<<] [< Back] [Forward >] [>>|]  ---(Scrubber)--- [Pills]      |
| 1 | ; Fibonacci Sequence Generator     +-----------------------------------+----------------------------+
| 2 |       LDI A, 0                     | CPU REGISTERS                     | ALU OPERATION (ADD)        |
| 3 |       LDI B, 1                     | A: 1 (0x01)     B: 2 (0x02)       | 1 + 1 = 2 (0x02)           |
| 4 |       LDI C, 8                     | C: 6 (0x06)     D: 1 (0x01)       | Binary: 00000010           |
| 5 | fib_loop:                          | PC: 4 (0x04)    SP: 255 (0xFF)    | Carry: 0                   |
| 6 |       OUT A                        | IR: ADD D, B    (Opcode: 0x10)    | Flags: Z=0, C=0, N=0       |
| 7 |       MOV D, A                     +-----------------------------------+----------------------------+
| 8 |       ADD D, B                     | CPU DATAPATH FLOW (Interactive SVG)                            |
| 9 |       MOV A, B                     | [PC] -> [Program Memory] -> [IR] -> [Control] -> [RegBank]     |
|   |                                    |                                         \-> [ALU] / [RAM] / [OUT|
+----------------------------------------+----------------------------------------------------------------+
| OUTPUT CONSOLE                         | DATA MEMORY INSPECTOR (256 Bytes RAM)                          |
| OUT: 0 (0x00)                          | 16x16 Hex Grid with Stack Pointer (SP) and Watchpoints         |
| OUT: 1 (0x01)                          | Selected Cell 0x15: Hex: 0xAB | Dec: 171 | Bin: 10101011       |
| OUT: 1 (0x01)                          | [Watch RAM[0x15]] Button                                       |
+----------------------------------------+----------------------------------------------------------------+
```

---

## Key Features

1. **Monaco Assembly Editor**:
   - Custom BL-8 Monarch syntax highlighting (keywords, registers, labels, numbers, brackets, comments).
   - Source-line diagnostic squigglies with error codes and descriptions.
   - Real-time active instruction line marker synchronized with the Program Counter (`PC`).
   - Gutter click to set and toggle **Breakpoints**.

2. **BL-8 Assembler Pipeline**:
   - Single-pass / two-pass resolution converting source code to intermediate instructions.
   - Validates operand counts, general vs special registers, brackets (`[addr]`), and 8-bit unsigned boundaries (`0` to `255`).
   - Case-insensitive mnemonics, registers, and labels.
   - Non-throwing, structured diagnostics (`UNKNOWN_MNEMONIC`, `DUPLICATE_LABEL`, `VALUE_OUT_OF_RANGE`, etc.).

3. **BL-8 CPU Engine**:
   - Standalone, deterministic 8-bit CPU core with Harvard memory separation.
   - 4 General-Purpose Registers: `A`, `B`, `C`, `D`.
   - Special Registers: `PC` (0–255), `SP` (starts at 255, grows down), and `IR` (latches fetched instruction).
   - ALU Status Flags: `Z` (Zero), `C` (Carry / Borrow), and `N` (Negative).
   - Stack overflow (depth > 256) and stack underflow (`SP = 255`) protection.

4. **Time Travel Debugger**:
   - Full observable state snapshotting (registers, memory, output, flags, cycle count) for every step.
   - Pre-execution baseline preserved at **Snapshot 0**.
   - Step Backward and Step Forward in history without re-executing instructions.
   - Timeline scrub bar and step micro-pills window to jump to any step in program history.
   - Branching: Resuming execution from an earlier snapshot discards future history and branches cleanly.

5. **CPU Datapath Flow View (SVG)**:
   - Visual architectural diagram showing Program Memory, PC, IR, Control Unit, Register Bank, ALU, Data RAM, and Output.
   - Components and buses highlight dynamically based on the exact executed instruction.

6. **ALU Visualization Panel**:
   - Displays real-time operation name, operands, formula, 8-bit binary bits, carry/borrow, and updated flags.
   - Automatically switches to an idle state when non-ALU instructions are executed.

7. **256-Byte Memory Inspector**:
   - 16×16 compact hexadecimal grid showing all 256 bytes of Data RAM.
   - Visual highlighting for newly modified memory cells.
   - Stack Pointer indicator badge (`SP`).
   - Detailed cell inspector showing Address, Hex, Unsigned Decimal, Signed Decimal, Binary, and ASCII character.
   - Interactive **Watchpoints** to pause execution when a monitored memory cell is modified.

8. **File Import / Export**:
   - Export source code to local `.asm` files.
   - Import `.asm` or `.txt` assembly files directly into the editor with drag-and-drop or file upload.

---

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + JSDOM

---

## BL-8 Architecture Specification

| Parameter | Specification |
|---|---|
| **Data Width** | 8-bit unsigned (0 to 255) / signed two's complement (-128 to 127) |
| **Address Width** | 8-bit (0 to 255) |
| **Program Memory** | 256 instruction slots (0 to 255, read-only during execution) |
| **Data Memory** | 256 bytes (0x00 to 0xFF, zero-initialized) |
| **General Registers** | `A`, `B`, `C`, `D` (8-bit) |
| **Special Registers** | `PC` (Program Counter, 8-bit), `SP` (Stack Pointer, 8-bit), `IR` (Instruction Register) |
| **Status Flags** | `Z` (Zero), `C` (Carry/Borrow), `N` (Negative MSB bit 7) |
| **Stack Semantics** | Grows downwards from address `0xFF` (`255`). Stack empty when `SP = 255`. |

---

## Instruction Set Architecture (22 Instructions)

| Category | Mnemonic | Syntax | Description | Flags |
|---|---|---|---|---|
| **Data Movement** | `MOV` | `MOV dest, src` | Copy register value to register | None |
| | `LDI` | `LDI reg, imm` | Load immediate (0-255 / 0x00-0xFF) into register | None |
| | `LOAD` | `LOAD reg, [addr]` | Load byte from Data Memory at address into register | None |
| | `STORE` | `STORE [addr], reg` | Store byte from register into Data Memory at address | None |
| **Arithmetic** | `ADD` | `ADD dest, src` | Add src to dest modulo 256 | Z, C, N |
| | `SUB` | `SUB dest, src` | Subtract src from dest modulo 256 (borrow in C) | Z, C, N |
| | `INC` | `INC reg` | Increment register by 1 (C preserved) | Z, N |
| | `DEC` | `DEC reg` | Decrement register by 1 (C preserved) | Z, N |
| **Logical** | `AND` | `AND dest, src` | Bitwise AND (clears C) | Z, N, C=0 |
| | `OR` | `OR dest, src` | Bitwise OR (clears C) | Z, N, C=0 |
| | `XOR` | `XOR dest, src` | Bitwise XOR (clears C) | Z, N, C=0 |
| | `NOT` | `NOT reg` | Bitwise NOT / Inversion (clears C) | Z, N, C=0 |
| **Control Flow** | `CMP` | `CMP reg, reg` | Compare registers (dest - src, flags set, registers untouched) | Z, C, N |
| | `JMP` | `JMP label` | Unconditional jump to target address | None |
| | `JZ` | `JZ label` | Jump if Zero flag is set (Z == 1) | None |
| | `JNZ` | `JNZ label` | Jump if Not Zero (Z == 0) | None |
| | `JC` | `JC label` | Jump if Carry flag is set (C == 1) | None |
| | `JN` | `JN label` | Jump if Negative flag is set (N == 1) | None |
| **Stack & I/O** | `PUSH` | `PUSH reg` | Push register to stack (`RAM[SP] = reg; SP--`) | None |
| | `POP` | `POP reg` | Pop stack into register (`SP++; reg = RAM[SP]`) | None |
| | `OUT` | `OUT reg` | Append register value (0-255) to output log | None |
| | `HLT` | `HLT` | Halt execution | None |

---

## Example Program Library

ByteLab comes with 7 built-in verified example programs:

1. **Hello ByteLab**: Basic register loading, copying, and console output.
2. **Addition & Status Flags**: Addition arithmetic, overflow carry (`C`), and zero flag (`Z`).
3. **Countdown Loop**: Loop mechanics using `DEC` and `JNZ`.
4. **Memory Summation**: Populating Data RAM with `STORE`, reading back with `LOAD`, and computing totals.
5. **Fibonacci Sequence**: Sequence generation producing `0, 1, 1, 2, 3, 5, 8, 13`.
6. **Stack Demonstration**: LIFO stack data inversion using `PUSH` and `POP`.
7. **Bitwise Lab**: Masking and bit manipulation using `AND`, `OR`, `XOR`, and `NOT`.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Albert-006/ByteLab.git
cd ByteLab

# Install dependencies
npm install
```

### Development
```bash
# Start local development server
npm run dev
```

### Running Tests
```bash
# Run all unit and integration test suites
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
# Type check and build static production assets in dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Vercel Deployment

ByteLab is built as a static Vite application and is 100% compatible with Vercel zero-config deployment:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

---

## Project Limitations

- **Instruction Limit**: Maximum 256 instruction slots in program memory.
- **Memory Limit**: 256 bytes of separate data RAM.
- **Addressing**: Direct memory addressing via immediate address `[addr]`. Indirect pointer addressing via registers (e.g. `[B]`) is intentionally not supported in the minimal BL-8 educational specification.
- **Execution Target**: Browser-only static environment.
