# BL-8 Instruction Set Architecture (ISA) Reference

This document establishes the single authoritative specification for the 21 instructions supported by the BL-8 architecture and assembler.

## Instruction Format & Operand Types

- **`reg`**: One of the four 8-bit general-purpose registers: `A`, `B`, `C`, or `D`. (Case-insensitive)
- **`imm`**: An 8-bit unsigned immediate value (`0` to `255` in decimal, or `0x00` to `0xFF` in hexadecimal).
- **`[addr]`**: A memory address enclosed in brackets, referring to a byte in Data Memory (`0` to `255` decimal, or `0x00` to `0xFF` hex).
- **`label`**: A symbolic identifier (e.g., `loop`, `start`, `exit`) resolving to a zero-based program memory instruction slot index (`0` to `255`).

---

## Authoritative Instruction Table

| Mnemonic | Opcode | Operand 1 | Operand 2 | Syntax Example | Flags Affected | Description |
|---|---|---|---|---|---|---|
| `MOV`   | `0x01` | `reg` (dest) | `reg` (src) | `MOV A, B` | None | Copies content of `src` register into `dest` register. |
| `LDI`   | `0x02` | `reg` (dest) | `imm`       | `LDI A, 42` / `LDI B, 0x2A` | None | Loads immediate value into `dest` register. |
| `LOAD`  | `0x03` | `reg` (dest) | `[addr]`    | `LOAD A, [0x10]` | None | Loads 8-bit byte from Data Memory at `addr` into `dest` register. |
| `STORE` | `0x04` | `[addr]`     | `reg` (src) | `STORE [0x10], A` | None | Stores 8-bit byte from `src` register into Data Memory at `addr`. |
| `ADD`   | `0x10` | `reg` (dest) | `reg` (src) | `ADD A, B` | `Z`, `C`, `N` | Adds `src` to `dest` (`dest = (dest + src) & 0xFF`). Sets `C` on overflow > 255. |
| `SUB`   | `0x11` | `reg` (dest) | `reg` (src) | `SUB A, B` | `Z`, `C`, `N` | Subtracts `src` from `dest` (`dest = (dest - src) & 0xFF`). Sets `C` on borrow (`dest < src`). |
| `INC`   | `0x12` | `reg` (dest) | None        | `INC C` | `Z`, `N` | Increments `dest` by 1 (`dest = (dest + 1) & 0xFF`). `C` flag is preserved. |
| `DEC`   | `0x13` | `reg` (dest) | None        | `DEC C` | `Z`, `N` | Decrements `dest` by 1 (`dest = (dest - 1) & 0xFF`). `C` flag is preserved. |
| `AND`   | `0x20` | `reg` (dest) | `reg` (src) | `AND A, B` | `Z`, `C` (cleared), `N` | Bitwise AND (`dest = dest & src`). Clears `C`. |
| `OR`    | `0x21` | `reg` (dest) | `reg` (src) | `OR A, B`  | `Z`, `C` (cleared), `N` | Bitwise OR (`dest = dest \| src`). Clears `C`. |
| `XOR`   | `0x22` | `reg` (dest) | `reg` (src) | `XOR A, B` | `Z`, `C` (cleared), `N` | Bitwise XOR (`dest = dest ^ src`). Clears `C`. |
| `NOT`   | `0x23` | `reg` (dest) | None        | `NOT A`    | `Z`, `N` | Bitwise NOT / one's complement (`dest = (~dest) & 0xFF`). `C` is preserved. |
| `CMP`   | `0x30` | `reg` (dest) | `reg` (src) | `CMP A, B` | `Z`, `C`, `N` | Compares `dest` with `src` via subtraction without storing result. Sets flags accordingly. |
| `JMP`   | `0x31` | `label`      | None        | `JMP loop` | None | Unconditional jump: sets `PC = target_address`. |
| `JZ`    | `0x32` | `label`      | None        | `JZ is_zero` | None | Conditional jump: if `Z == 1`, sets `PC = target_address`. |
| `JNZ`   | `0x33` | `label`      | None        | `JNZ loop` | None | Conditional jump: if `Z == 0`, sets `PC = target_address`. |
| `JC`    | `0x34` | `label`      | None        | `JC overflow` | None | Conditional jump: if `C == 1`, sets `PC = target_address`. |
| `JN`    | `0x35` | `label`      | None        | `JN negative` | None | Conditional jump: if `N == 1`, sets `PC = target_address`. |
| `PUSH`  | `0x40` | `reg` (src)  | None        | `PUSH A` | None | Pushes register onto stack: `RAM[SP] = src; SP = (SP - 1) & 0xFF`. |
| `POP`   | `0x41` | `reg` (dest) | None        | `POP A` | None | Pops top of stack into register: `SP = (SP + 1) & 0xFF; dest = RAM[SP]`. |
| `OUT`   | `0x42` | `reg` (src)  | None        | `OUT A` | None | Outputs byte from register `src` to external display / output buffer. |
| `HLT`   | `0xFF` | None         | None        | `HLT` | None | Halts CPU execution. PC does not advance. |

---

## Opcode Constants

The numeric opcode constants are defined as follows:

```typescript
export const OPCODES = {
  MOV: 0x01,
  LDI: 0x02,
  LOAD: 0x03,
  STORE: 0x04,
  ADD: 0x10,
  SUB: 0x11,
  INC: 0x12,
  DEC: 0x13,
  AND: 0x20,
  OR: 0x21,
  XOR: 0x22,
  NOT: 0x23,
  CMP: 0x30,
  JMP: 0x31,
  JZ: 0x32,
  JNZ: 0x33,
  JC: 0x34,
  JN: 0x35,
  PUSH: 0x40,
  POP: 0x41,
  OUT: 0x42,
  HLT: 0xff,
} as const;
```

---

## Assembly Rules & Diagnostics

1. **Whitespace**: Leading, trailing, and inter-operand whitespace is ignored. Commas separate multiple operands.
2. **Comments**: Prefixed by `;` anywhere on a line; trailing content is stripped before parsing.
3. **Labels**:
   - Must start with a letter or underscore (`[a-zA-Z_]`) and contain alphanumeric characters or underscores (`[a-zA-Z0-9_]*`).
   - Defined by appending a colon `:` (e.g., `start:`).
   - Can appear standalone on a line or preceding an instruction on the same line.
   - Duplicate label definitions produce diagnostic error `DUPLICATE_LABEL`.
   - References to undefined labels produce diagnostic error `UNDEFINED_LABEL`.
4. **Range Checking**:
   - Immediate values (`imm`) and addresses (`[addr]`) must evaluate to integer values between `0` and `255` inclusive.
   - Out-of-range values produce diagnostic error `VALUE_OUT_OF_RANGE`.
5. **Instruction Limit**:
   - Total program instructions cannot exceed 256. Programs with 257+ instructions produce diagnostic error `PROGRAM_TOO_LARGE`.
6. **Error Reporting**:
   - All errors are accumulated as structured diagnostics with source line number, column, diagnostic code, and human-readable message.
