/**
 * Verified Preset Example Assembly Programs for ByteLab BL-8
 */

export interface ExampleProgram {
  id: string;
  name: string;
  description: string;
  concepts: string[];
  expectedOutput: number[];
  code: string;
}

export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    id: 'hello_bytelab',
    name: '1. Hello ByteLab',
    description: 'Basic introduction to loading immediate values into registers and outputting them.',
    concepts: ['LDI (Load Immediate)', 'MOV (Copy Register)', 'OUT (Output)', 'HLT (Halt)'],
    expectedOutput: [42, 84, 126],
    code: `; ============================================
; 1. Hello ByteLab: Basic Registers & Output
; Loads values, copies between registers, and outputs
; ============================================

      LDI A, 42      ; Load decimal 42 into Register A
      OUT A          ; Outputs 42

      MOV B, A       ; Copy A into B
      ADD B, A       ; B = 42 + 42 = 84
      OUT B          ; Outputs 84

      MOV C, B       ; Copy B (84) into C
      ADD C, A       ; C = 84 + 42 = 126
      OUT C          ; Outputs 126

      HLT            ; Halt processor
`,
  },
  {
    id: 'addition_flags',
    name: '2. Addition & Flags',
    description: 'Demonstrates unsigned 8-bit addition, carry flag on overflow >255, and zero flag.',
    concepts: ['ADD', 'Carry Flag (C)', 'Zero Flag (Z)', '8-bit Overflow Modulo 256'],
    expectedOutput: [250, 44, 0],
    code: `; ============================================
; 2. Addition & Status Flags
; Demonstrates standard addition, carry overflow, and zero wrapping
; ============================================

      ; Case 1: Normal addition (150 + 100 = 250, C=0, Z=0)
      LDI A, 150
      LDI B, 100
      ADD A, B
      OUT A          ; Outputs 250

      ; Case 2: Overflow addition (200 + 100 = 300 -> 44, C=1)
      LDI A, 200
      LDI B, 100
      ADD A, B       ; Result 44, sets Carry flag
      OUT A          ; Outputs 44

      ; Case 3: Exact 256 wrap (255 + 1 -> 0, C=1, Z=1)
      LDI A, 255
      LDI B, 1
      ADD A, B       ; Result 0, sets Zero and Carry flags
      OUT A          ; Outputs 0

      HLT
`,
  },
  {
    id: 'counter',
    name: '3. Countdown Loop',
    description: 'Demonstrates loop counters, flags, conditional jumps (JNZ), and termination.',
    concepts: ['DEC (Decrement)', 'Z Flag (Zero)', 'JNZ (Jump if Not Zero)', 'Labels & Loops'],
    expectedOutput: [5, 4, 3, 2, 1, 0],
    code: `; ============================================
; 3. Countdown Loop
; Counts down from 5 to 0 using DEC and JNZ
; ============================================

      LDI A, 5       ; Initialize counter

count_loop:
      OUT A          ; Output current counter value
      DEC A          ; Decrement A (sets Z flag when result is 0)
      JNZ count_loop ; Repeat while A != 0

      OUT A          ; Output final 0
      HLT            ; Done
`,
  },
  {
    id: 'memory_sum',
    name: '4. Memory Summation',
    description: 'Direct memory addressing using STORE and LOAD to write and read Data RAM arrays.',
    concepts: ['STORE [addr]', 'LOAD [addr]', 'Data Memory RAM', 'Accumulator pattern'],
    expectedOutput: [75],
    code: `; ============================================
; 4. Data Memory Summation
; Stores 3 numbers into RAM [0x10..0x12], sums them, and stores total
; ============================================

      ; Step 1: Write data values to RAM addresses
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
      OUT B          ; Outputs 75
      HLT
`,
  },
  {
    id: 'fibonacci',
    name: '5. Fibonacci Sequence',
    description: 'Generates the first 8 numbers of the Fibonacci sequence and outputs each term.',
    concepts: ['Sequence Generation', 'Register Swapping', 'Loops', 'Arithmetic'],
    expectedOutput: [0, 1, 1, 2, 3, 5, 8, 13],
    code: `; ============================================
; 5. Fibonacci Sequence Generator
; Computes: F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, ...
; ============================================

      LDI A, 0       ; F(n) = 0
      LDI B, 1       ; F(n+1) = 1
      LDI C, 8       ; Generate 8 terms

fib_loop:
      OUT A          ; Output current term
      MOV D, A       ; Copy F(n) to D
      ADD D, B       ; D = F(n) + F(n+1)
      MOV A, B       ; F(n) = F(n+1)
      MOV B, D       ; F(n+1) = new term
      DEC C          ; Decrement counter
      JNZ fib_loop   ; Loop until counter is 0

      HLT
`,
  },
  {
    id: 'stack_demo',
    name: '6. Stack Demonstration',
    description: 'LIFO (Last-In First-Out) stack behavior using PUSH and POP with Stack Pointer SP.',
    concepts: ['PUSH', 'POP', 'Stack Pointer (SP)', 'LIFO Inversion'],
    expectedOutput: [30, 20, 10],
    code: `; ============================================
; 6. Stack Demonstration: LIFO Data Reversal
; Pushes 10, 20, 30 onto stack, pops in reverse order
; ============================================

      LDI A, 10
      LDI B, 20
      LDI C, 30

      ; Push onto stack (grows down from RAM[0xFF])
      PUSH A         ; RAM[255] = 10, SP = 254
      PUSH B         ; RAM[254] = 20, SP = 253
      PUSH C         ; RAM[253] = 30, SP = 252

      ; Pop from stack in reverse order
      POP D          ; D = 30
      OUT D          ; Outputs 30

      POP D          ; D = 20
      OUT D          ; Outputs 20

      POP D          ; D = 10
      OUT D          ; Outputs 10

      HLT
`,
  },
  {
    id: 'bitwise',
    name: '7. Bitwise Lab',
    description: 'Demonstrates bitwise logic operations: AND, OR, XOR, and NOT.',
    concepts: ['AND (Masking)', 'OR (Combining)', 'XOR (Toggling)', 'NOT (Inversion)'],
    expectedOutput: [10, 175, 85],
    code: `; ============================================
; 7. Bitwise Lab: Logic & Masking Operations
; Demonstrates AND, OR, XOR, and NOT operations
; ============================================

      LDI A, 0xAA    ; Binary: 10101010
      LDI B, 0x0F    ; Binary: 00001111

      ; Mask lower nibble with AND
      MOV C, A
      AND C, B       ; 10101010 & 00001111 = 00001010 (10)
      OUT C          ; Outputs 10

      ; Combine with OR
      MOV C, A
      OR C, B        ; 10101010 | 00001111 = 10101111 (175)
      OUT C          ; Outputs 175

      ; Invert with NOT
      NOT A          ; ~10101010 = 01010101 (85)
      OUT A          ; Outputs 85

      HLT
`,
  },
];
