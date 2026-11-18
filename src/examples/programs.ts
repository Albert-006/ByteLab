/**
 * Preset Example Assembly Programs for ByteLab BL-8
 */

export interface ExampleProgram {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    description: 'Generates the first 8 numbers of the Fibonacci sequence and outputs each term.',
    code: `; ============================================
; ByteLab BL-8: Fibonacci Sequence Generator
; Computes: F(0)=0, F(1)=1, F(2)=1, F(3)=2, ...
; ============================================

      LDI A, 0       ; F(n) = 0
      LDI B, 1       ; F(n+1) = 1
      LDI C, 8       ; Loop counter (8 terms)

fib_loop:
      OUT A          ; Output current Fibonacci term
      MOV D, A       ; Copy F(n) to D
      ADD D, B       ; D = F(n) + F(n+1)
      MOV A, B       ; Shift: F(n) becomes F(n+1)
      MOV B, D       ; Shift: F(n+1) becomes new sum
      DEC C          ; Decrement loop counter
      JNZ fib_loop   ; Repeat until counter reaches 0

      HLT            ; Halt CPU execution
`,
  },
  {
    id: 'counter',
    name: 'Countdown Loop',
    description: 'Demonstrates decrementing, flag checking, conditional branching, and output.',
    code: `; ============================================
; ByteLab BL-8: Countdown Loop
; Counts down from 5 to 0 and outputs each step
; ============================================

      LDI A, 5       ; Initialize counter to 5

count_loop:
      OUT A          ; Output current value
      DEC A          ; Decrement A (sets Z flag when 0)
      JNZ count_loop ; Jump if Not Zero back to loop

      OUT A          ; Output final 0
      HLT            ; Done
`,
  },
  {
    id: 'memory_sum',
    name: 'Data Memory Summation',
    description: 'Populates Data RAM addresses, reads them back, computes sum, and stores result.',
    code: `; ============================================
; ByteLab BL-8: Data Memory Summation
; Stores 3 numbers into RAM, sums them, and stores total
; ============================================

      ; Step 1: Store numbers into RAM [0x10], [0x11], [0x12]
      LDI A, 15
      STORE [0x10], A
      LDI A, 25
      STORE [0x11], A
      LDI A, 35
      STORE [0x12], A

      ; Step 2: Accumulate sum in Register B
      LDI B, 0
      LOAD C, [0x10]
      ADD B, C
      LOAD C, [0x11]
      ADD B, C
      LOAD C, [0x12]
      ADD B, C

      ; Step 3: Store total (75) to RAM [0x20] and OUT
      STORE [0x20], B
      OUT B
      HLT
`,
  },
  {
    id: 'stack_demo',
    name: 'Stack Reversal & Subroutine',
    description: 'Pushes multiple values onto the call stack and pops them in LIFO order.',
    code: `; ============================================
; ByteLab BL-8: Stack Demonstration
; Pushes values 10, 20, 30 onto the stack, then pops them
; ============================================

      LDI A, 10
      LDI B, 20
      LDI C, 30

      ; Push in order: 10, then 20, then 30
      PUSH A
      PUSH B
      PUSH C

      ; Pop in reverse order: 30, then 20, then 10
      POP D
      OUT D          ; Outputs 30

      POP D
      OUT D          ; Outputs 20

      POP D
      OUT D          ; Outputs 10

      HLT
`,
  },
  {
    id: 'bitwise',
    name: 'Bitwise Logic Operations',
    description: 'Demonstrates AND, OR, XOR, NOT and arithmetic flags.',
    code: `; ============================================
; ByteLab BL-8: Bitwise Logic & Masking
; Demonstrates AND, OR, XOR, and NOT operations
; ============================================

      LDI A, 0xAA    ; 10101010 in binary
      LDI B, 0x0F    ; 00001111 in binary

      ; Mask lower nibble with AND
      MOV C, A
      AND C, B       ; C = 0x0A (10)
      OUT C

      ; Combine with OR
      MOV C, A
      OR C, B        ; C = 0xAF (175)
      OUT C

      ; Invert with NOT
      NOT A          ; A = 0x55 (85)
      OUT A

      HLT
`,
  },
];
