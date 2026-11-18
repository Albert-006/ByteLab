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
  - Increments sequentially after each non-branch instruction.
  - Updated to branch target on successful jumps (`JMP`, `JZ`, `JNZ`, `JC`, `JN`).
  - Initialized to `0`.
- **`SP` (Stack Pointer, 8-bit)**:
  - Points to the current top of the call/data stack located in Data Memory (RAM).
  - The stack grows downwards from the highest address (`0xFF` / `255`).
  - Initialized to `255` (`0xFF`).
  - `PUSH`: Writes value to `RAM[SP]`, then decrements `SP` (`SP = (SP - 1) & 0xFF`).
  - `POP`: Increments `SP` (`SP = (SP + 1) & 0xFF`), then reads value from `RAM[SP]`.
- **`IR` (Instruction Register)**:
  - Latches the decoded intermediate instruction representation during execution.

### 2.3 Status Flags
The BL-8 CPU maintains three 1-bit flags in the status register:
1. **`Z` (Zero Flag)**:
   - Set to `1` when an operation's result is zero (`result == 0`).
   - Cleared to `0` when non-zero.
2. **`C` (Carry / Borrow Flag)**:
   - Set to `1` if an unsigned addition overflows (`result > 255`) or an unsigned subtraction borrows (`a < b`).
   - Cleared to `0` otherwise.
   - Cleared during bitwise logical operations (`AND`, `OR`, `XOR`).
   - Not affected by `INC` and `DEC` to simplify loop counter mechanics.
3. **`N` (Negative Flag)**:
   - Reflects the most significant bit (MSB, bit 7) of the 8-bit result (`(result & 0x80) != 0`).
   - Set to `1` if result is negative in two's complement, `0` otherwise.

Initial flag states on reset: `Z = 0`, `C = 0`, `N = 0`.

---

## 3. Memory Architecture

The BL-8 features a **Harvard-style memory architecture** where program code and data reside in completely isolated address spaces:

1. **Program Memory**:
   - Size: 256 instruction slots (`0` to `255`).
   - Each slot holds one parsed and validated intermediate instruction object.
   - Programs containing more than 256 instructions are rejected by the assembler.
   - Program memory is read-only during program execution.

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
| `SP` | `0xFF` (255) | Top of stack memory |
| `IR` | `null` / Empty | Cleared |
| `Z` | `0` | Zero flag |
| `C` | `0` | Carry flag |
| `N` | `0` | Negative flag |
| RAM (`0x00`..`0xFF`) | All `0x00` | Data memory cleared |
