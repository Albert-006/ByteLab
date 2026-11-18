# BL-8 Instruction Set Architecture (ISA) Reference

This document establishes the single authoritative specification for the 22 instructions supported by the BL-8 architecture, assembler, and execution engine.

## Instruction Format & Operand Types

- **`reg`**: One of the four 8-bit general-purpose registers: `A`, `B`, `C`, or `D`. (Case-insensitive)
- **`imm`**: An 8-bit unsigned immediate value (`0` to `255` in decimal, or `0x00` to `0xFF` in hexadecimal).
- **`[addr]`**: A memory address enclosed in brackets, referring to a byte in Data Memory (`0` to `255` decimal, or `0x00` to `0xFF` hex).
- **`label`**: A symbolic identifier (e.g., `loop`, `start`, `exit`) resolving to a zero-based program memory instruction slot index (`0` to `255`).

---

## Authoritative Instruction Table

| Mnemonic | Opcode | Operand 1 | Operand 2 | Syntax Example | Flags Affected | Execution Semantics |
|---|---|---|---|---|---|---|
| `MOV`   | `0x01` | `reg` (dest) | `reg` (src) | `MOV A, B` | None | Copies content of `src` register into `dest` register. Flags unchanged. |
| `LDI`   | `0x02` | `reg` (dest) | `imm`       | `LDI A, 42` / `LDI B, 0x2A` | None | Loads immediate value into `dest` register. Flags unchanged. |
| `LOAD`  | `0x03` | `reg` (dest) | `[addr]`    | `LOAD A, [0x10]` | None | Loads 8-bit byte from Data Memory at `addr` into `dest` register. Flags unchanged. |
| `STORE` | `0x04` | `[addr]`     | `reg` (src) | `STORE [0x10], A` | None | Stores 8-bit byte from `src` register into Data Memory at `addr`. Flags unchanged. |
| `ADD`   | `0x10` | `reg` (dest) | `reg` (src) | `ADD A, B` | `Z`, `C`, `N` | `dest = (dest + src) & 0xFF`. `C = (dest + src) > 255`. Updates `Z`, `N`. |
| `SUB`   | `0x11` | `reg` (dest) | `reg` (src) | `SUB A, B` | `Z`, `C`, `N` | `dest = (dest - src) & 0xFF`. `C = dest < src` (borrow). Updates `Z`, `N`. |
| `INC`   | `0x12` | `reg` (dest) | None        | `INC C` | `Z`, `N` | `dest = (dest + 1) & 0xFF`. Updates `Z`, `N`. `C` flag preserved. |
| `DEC`   | `0x13` | `reg` (dest) | None        | `DEC C` | `Z`, `N` | `dest = (dest - 1) & 0xFF`. Updates `Z`, `N`. `C` flag preserved. |
| `AND`   | `0x20` | `reg` (dest) | `reg` (src) | `AND A, B` | `Z`, `C`, `N` | `dest = dest & src`. Updates `Z`, `N`. `C` cleared (`false`). |
| `OR`    | `0x21` | `reg` (dest) | `reg` (src) | `OR A, B`  | `Z`, `C`, `N` | `dest = dest \| src`. Updates `Z`, `N`. `C` cleared (`false`). |
| `XOR`   | `0x22` | `reg` (dest) | `reg` (src) | `XOR A, B` | `Z`, `C`, `N` | `dest = dest ^ src`. Updates `Z`, `N`. `C` cleared (`false`). |
| `NOT`   | `0x23` | `reg` (dest) | None        | `NOT A`    | `Z`, `C`, `N` | `dest = (~dest) & 0xFF`. Updates `Z`, `N`. `C` cleared (`false`). |
| `CMP`   | `0x30` | `reg` (dest) | `reg` (src) | `CMP A, B` | `Z`, `C`, `N` | Calculates `dest - src` without writing to register. `C = dest < src`. Updates `Z`, `N`. |
| `JMP`   | `0x31` | `label`      | None        | `JMP loop` | None | Unconditional jump: `PC = target_address`. |
| `JZ`    | `0x32` | `label`      | None        | `JZ is_zero` | None | If `Z == true`, `PC = target_address`. |
| `JNZ`   | `0x33` | `label`      | None        | `JNZ loop` | None | If `Z == false`, `PC = target_address`. |
| `JC`    | `0x34` | `label`      | None        | `JC overflow` | None | If `C == true`, `PC = target_address`. |
| `JN`    | `0x35` | `label`      | None        | `JN negative` | None | If `N == true`, `PC = target_address`. |
| `PUSH`  | `0x40` | `reg` (src)  | None        | `PUSH A` | None | Pushes register onto stack: `RAM[SP] = src; SP = (SP - 1) & 0xFF`. Detects stack overflow. |
| `POP`   | `0x41` | `reg` (dest) | None        | `POP A` | None | Pops top of stack: if `SP == 255` error underflow; else `SP = (SP + 1) & 0xFF; dest = RAM[SP]`. |
| `OUT`   | `0x42` | `reg` (src)  | None        | `OUT A` | None | Appends unsigned decimal value of register `src` (0–255) to the CPU output list. |
| `HLT`   | `0xFF` | None         | None        | `HLT` | None | Halts processor execution. Subsequent steps do not modify state. |

---

## Detailed Stack Semantics

- **Initial State**: `SP = 255`. The stack pointer points to the address where the next pushed byte will be stored.
- **Empty Stack Boundary**: An `SP` value of `255` represents an empty stack.
- **`POP` Underflow**: Executing `POP` when `SP === 255` triggers a `STACK_UNDERFLOW` runtime error, halts execution, and reports the error.
- **`PUSH` Overflow**: The stack can hold up to 256 bytes (depth 0 to 256). If `PUSH` is executed when the stack depth is already 256, a `STACK_OVERFLOW` runtime error is triggered.

---

## Program Counter & Execution Cycle

Each CPU step follows a strictly deterministic sequence:
1. **Status Check**: If the CPU status is already `'halted'` or `'error'`, `step()` immediately returns the current state without modification.
2. **Bounds Check**: If `PC < 0` or `PC >= 256`, or if `programMemory[PC]` is `null`/empty:
   - If PC has reached the end of loaded instructions, CPU cleanly transitions to `'halted'`.
   - If PC points to an unmapped slot outside the loaded program, a `PROGRAM_COUNTER_OUT_OF_BOUNDS` runtime error is reported.
3. **Fetch**: Latch `IR = programMemory[PC]`.
4. **Advance PC**: Increment `PC = PC + 1` before completing instruction execution.
5. **Execute**: Dispatch instruction logic.
   - For taken branches (`JMP`, `JZ`, `JNZ`, `JC`, `JN`), overwrite `PC` with the resolved target address.
   - For `HLT`, set status to `'halted'`.
   - Increment CPU cycle count by 1.
