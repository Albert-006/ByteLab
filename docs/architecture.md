# BL-8 Architecture Specification

## 1. Architectural Overview

The **BL-8** (ByteLab 8-Bit) is an educational, simplified Harvard-architecture 8-bit central processing unit. It is designed to provide transparent, deterministic execution that allows students to observe register state transitions, ALU operations, stack manipulation, and memory interactions.

```
+-------------------------------------------------------------+
|                      BL-8 CPU ARCHITECTURE                   |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   | General Registers     |     | Special Registers     |   |
|   |  - A (8-bit)          |     |  - PC (Program Counter)|  |
|   |  - B (8-bit)          |     |  - SP (Stack Pointer) |   |
|   |  - C (8-bit)          |     |  - IR (Instr Register)|   |
|   |  - D (8-bit)          |     +-----------------------+   |
|   +-----------------------+     | Status Flags          |   |
|                                 |  - Z (Zero)           |   |
|   +-----------------------+     |  - C (Carry)          |   |
|   | ALU                   |     |  - N (Negative)       |   |
|   | (8-bit Add/Sub/Logic) |     +-----------------------+   |
|   +-----------------------+                                 |
+-------------------------------------------------------------+
               |                               |
       Instruction Bus                     Data Bus
               |                               |
               v                               v
+-------------------------------+   +-------------------------------+
| PROGRAM MEMORY                |   | DATA MEMORY (RAM)             |
| 256 Instruction Slots (0-255) |   | 256 Bytes (0x00 - 0xFF)       |
+-------------------------------+   +-------------------------------+
```

---

## 2. Register Model

### 2.1 General-Purpose Registers
The BL-8 architecture includes four 8-bit general-purpose data registers:
- `A` (Accumulator / Primary register)
- `B` (Secondary register)
- `C` (Counter / Auxiliary register)
- `D` (Data / Auxiliary register)

All four registers hold 8-bit unsigned values (`0` to `255`, `0x00` to `0xFF`) or signed two's complement integers (`-128` to `+127`). They are initialized to `0` upon machine reset.

### 2.2 Special-Purpose Registers
- **`PC` (Program Counter, 8-bit)**:
  - Points to the index of the next instruction in program memory to fetch and execute.
  - Valid range: `0` to `255`.
  - Normal execution lifecycle:
    1. Fetch instruction at `PC`.
    2. Place instruction in `IR`.
    3. Increment `PC` to `PC + 1` before completing execution.
    4. Execute instruction. If the instruction is a taken branch (`JMP`, `JZ`, `JNZ`, `JC`, `JN`), `PC` is overwritten with the target address.
  - Initialized to `0`.
- **`SP` (Stack Pointer, 8-bit)**:
  - Points to the current top of the call/data stack located in Data Memory (RAM).
  - The stack grows downwards from the highest address (`0xFF` / `255`).
  - **Initial empty-stack boundary**: `SP = 255` (`0xFF`). Stack is considered empty when `SP = 255`.
  - `PUSH`:
    - If stack already holds 256 items (stack depth reaches 256), a `STACK_OVERFLOW` runtime error occurs.
    - Otherwise, writes value to `RAM[SP]`, then decrements `SP` (`SP = (SP - 1) & 0xFF`).
  - `POP`:
    - If the stack is empty (`SP == 255`), a `STACK_UNDERFLOW` runtime error occurs.
    - Otherwise, increments `SP` (`SP = (SP + 1) & 0xFF`), then reads the value from `RAM[SP]`.
- **`IR` (Instruction Register)**:
  - Latches the decoded intermediate instruction representation fetched at the start of each step. Initialized to `null`.

### 2.3 Status Flags
The BL-8 CPU maintains three 1-bit flags in the status register:
1. **`Z` (Zero Flag)**:
   - Set to `true` (1) when an operation's 8-bit result is zero (`result === 0`).
   - Cleared to `false` (0) when non-zero.
2. **`C` (Carry / Borrow Flag)**:
   - For addition (`ADD`): Set to `true` if unsigned sum exceeds 255 (`sum > 255`), else `false`.
   - For subtraction & comparison (`SUB`, `CMP`): Set to `true` if a borrow occurs (`dest < src`), else `false`.
   - For bitwise logical operations (`AND`, `OR`, `XOR`, `NOT`): Cleared to `false`.
   - For increment & decrement (`INC`, `DEC`): `C` flag is **preserved** (unaffected), conforming to standard 8-bit arithmetic loop conventions.
3. **`N` (Negative Flag)**:
   - Reflects the most significant bit (MSB, bit 7) of the 8-bit result (`(result & 0x80) !== 0`).
   - Set to `true` if bit 7 is 1, `false` otherwise.

Initial flag states on reset: `Z = false`, `C = false`, `N = false`.

---

## 3. Memory Architecture

The BL-8 features a **Harvard-style memory architecture** where program code and data reside in completely isolated address spaces:

1. **Program Memory**:
   - Size: 256 instruction slots (`0` to `255`).
   - Each slot holds one parsed and validated intermediate instruction object.
   - Program memory is read-only during execution.
   - Attempting to fetch beyond the loaded program boundary safely halts the CPU or reports an out-of-bounds error.

2. **Data Memory (RAM)**:
   - Size: 256 bytes (addresses `0x00` to `0xFF`).
   - Byte-addressable via immediate addresses (`[addr]`) in `LOAD` and `STORE` instructions.
   - Zero-initialized at reset.
   - Shared between program data variables and the stack (top-down from `0xFF`).

---

## 4. Reset State Summary

| Register / Flag | Initial Value | Notes |
|---|---|---|
| `A` | `0x00` (0) | Primary register |
| `B` | `0x00` (0) | General register |
| `C` | `0x00` (0) | General register |
| `D` | `0x00` (0) | General register |
| `PC` | `0x00` (0) | First instruction slot |
| `SP` | `0xFF` (255) | Top of stack memory (empty stack) |
| `IR` | `null` | Cleared |
| `Z` | `false` | Zero flag |
| `C` | `false` | Carry flag |
| `N` | `false` | Negative flag |
| RAM (`0x00`..`0xFF`) | All `0x00` | Data memory cleared |
| Output | `[]` | Output port buffer cleared |
| Status | `'idle'` | Ready to run |
