/**
 * Monaco Editor Language Definition and Dark Theme for BL-8 Assembly
 */

import type { Monaco } from '@monaco-editor/react';

export const BL8_LANGUAGE_ID = 'bl8-asm';
export const BL8_THEME_ID = 'bl8-dark';

export function registerBl8Language(monaco: Monaco): void {
  // Check if already registered
  const languages = monaco.languages.getLanguages();
  if (languages.some((lang: { id: string }) => lang.id === BL8_LANGUAGE_ID)) {
    return;
  }

  monaco.languages.register({ id: BL8_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(BL8_LANGUAGE_ID, {
    ignoreCase: true,
    defaultToken: 'invalid',

    keywords: [
      'MOV',
      'LDI',
      'LOAD',
      'STORE',
      'ADD',
      'SUB',
      'INC',
      'DEC',
      'AND',
      'OR',
      'XOR',
      'NOT',
      'CMP',
      'JMP',
      'JZ',
      'JNZ',
      'JC',
      'JN',
      'PUSH',
      'POP',
      'OUT',
      'HLT',
    ],

    registers: ['A', 'B', 'C', 'D', 'PC', 'SP', 'IR'],

    tokenizer: {
      root: [
        // Comments
        [/;.*$/, 'comment'],

        // Labels at beginning of line or token
        [/^[a-zA-Z_][a-zA-Z0-9_]*:/, 'type.identifier'],
        [/[a-zA-Z_][a-zA-Z0-9_]*:/, 'type.identifier'],

        // Numbers: Hexadecimal & Decimal
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\b\d+\b/, 'number'],

        // Brackets & Punctuation
        [/[[\]]/, 'delimiter.bracket'],
        [/,/, 'delimiter'],

        // Words: Mnemonics, Registers, or Identifiers
        [
          /[a-zA-Z_][a-zA-Z0-9_]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@registers': 'variable.predefined',
              '@default': 'identifier',
            },
          },
        ],

        // Whitespace
        [/\s+/, 'white'],
      ],
    },
  });

  monaco.editor.defineTheme(BL8_THEME_ID, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
      { token: 'variable.predefined', foreground: '79c0ff', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: 'd2a8ff', fontStyle: 'bold' },
      { token: 'identifier', foreground: 'e6edf3' },
      { token: 'number.hex', foreground: 'ffa657' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'delimiter.bracket', foreground: 'a5d6ff' },
      { token: 'delimiter', foreground: '8b949e' },
    ],
    colors: {
      'editor.background': '#111722',
      'editor.foreground': '#e6edf3',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#79c0ff',
      'editor.lineHighlightBackground': '#161f2e',
      'editorCursor.foreground': '#58a6ff',
      'editor.selectionBackground': '#264f78',
      'editorWidget.background': '#161b22',
      'editorWidget.border': '#30363d',
    },
  });
}
