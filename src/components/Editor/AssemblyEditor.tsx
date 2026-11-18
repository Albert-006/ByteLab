/**
 * Assembly Editor Component
 * Integrates Monaco Editor with custom BL-8 syntax highlighting,
 * active instruction line decoration, breakpoint glyphs, and diagnostics overlay.
 */

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { AssemblerDiagnostic } from '../../core/types/assembler.types';
import {
  BL8_LANGUAGE_ID,
  BL8_THEME_ID,
  registerBl8Language,
} from './monaco-bl8-language';
import { AlertCircle, CircleDot } from 'lucide-react';

export interface AssemblyEditorProps {
  code: string;
  onChange: (value: string) => void;
  activeSourceLine: number | null;
  diagnostics: AssemblerDiagnostic[];
  isDirty: boolean;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
}

export const AssemblyEditor: React.FC<AssemblyEditorProps> = ({
  code,
  onChange,
  activeSourceLine,
  diagnostics,
  isDirty,
  breakpoints,
  onToggleBreakpoint,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const activeDecorationsRef = useRef<string[]>([]);
  const breakpointDecorationsRef = useRef<string[]>([]);

  // Handle Monaco Mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerBl8Language(monaco);

    // Gutter click to toggle breakpoint
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position?.lineNumber;
        if (line) {
          onToggleBreakpoint(line);
        }
      }
    });
  };

  // Update active line decoration
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (activeSourceLine !== null && activeSourceLine > 0) {
      activeDecorationsRef.current = editor.deltaDecorations(activeDecorationsRef.current, [
        {
          range: new monaco.Range(activeSourceLine, 1, activeSourceLine, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-active-line-bg',
            glyphMarginClassName: 'monaco-active-line-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(activeSourceLine);
    } else {
      activeDecorationsRef.current = editor.deltaDecorations(activeDecorationsRef.current, []);
    }
  }, [activeSourceLine]);

  // Update breakpoint glyph decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const bpDecorations = Array.from(breakpoints).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'monaco-breakpoint-glyph',
        glyphMarginHoverMessage: { value: `Breakpoint on line ${line}` },
      },
    }));

    breakpointDecorationsRef.current = editor.deltaDecorations(
      breakpointDecorationsRef.current,
      bpDecorations
    );
  }, [breakpoints]);

  // Update diagnostic markers in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const markers = diagnostics.map((diag) => ({
      startLineNumber: diag.line,
      startColumn: diag.column ?? 1,
      endLineNumber: diag.line,
      endColumn: (diag.column ?? 1) + 15,
      message: `[${diag.code}] ${diag.message}`,
      severity:
        diag.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, 'bl8-assembler', markers);
  }, [diagnostics]);

  // Fallback for non-browser / JSDOM test environments
  const isTestEnvironment =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  return (
    <div className="flex flex-col h-full bg-[#111722] border border-[#30363d] rounded-lg overflow-hidden shadow-lg">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">BL-8 Assembly Editor</span>
          {isDirty && (
            <span
              data-testid="dirty-badge"
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30"
            >
              Unassembled Changes
            </span>
          )}
          {breakpoints.size > 0 && (
            <span
              data-testid="breakpoints-badge"
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/60 text-red-300 border border-red-800/40 flex items-center gap-1"
            >
              <CircleDot className="w-3 h-3 text-red-400" />
              <span>{breakpoints.size} BP</span>
            </span>
          )}
        </div>
        <div className="text-slate-500 text-[11px]">
          {activeSourceLine ? `Executing Line ${activeSourceLine}` : 'Ready'}
        </div>
      </div>

      {/* Main Editor View */}
      <div className="flex-1 min-h-[300px] relative">
        {isTestEnvironment ? (
          <div className="w-full h-full flex flex-col">
            <textarea
              data-testid="assembly-editor-textarea"
              className="w-full flex-1 p-4 font-mono text-sm bg-[#111722] text-slate-100 resize-none focus:outline-none"
              value={code}
              onChange={(e) => onChange(e.target.value)}
            />
            {/* Test helper button to toggle breakpoint */}
            <div className="p-2 bg-[#161b22] border-t border-[#30363d] flex gap-2">
              <button
                data-testid="test-toggle-bp-btn"
                onClick={() => onToggleBreakpoint(2)}
                className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800"
              >
                Toggle BP Line 2
              </button>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={BL8_LANGUAGE_ID}
            theme={BL8_THEME_ID}
            value={code}
            onChange={(val) => onChange(val ?? '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              glyphMargin: true,
            }}
          />
        )}
      </div>

      {/* Diagnostics Panel Footer */}
      {diagnostics.length > 0 && (
        <div
          data-testid="diagnostics-panel"
          className="border-t border-[#30363d] bg-[#161b22] max-h-40 overflow-y-auto p-2"
        >
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Diagnostics ({diagnostics.length})</span>
          </div>
          <div className="flex flex-col gap-1 mt-1 font-mono text-xs">
            {diagnostics.map((diag, index) => (
              <div
                key={index}
                data-testid={`diagnostic-item-${index}`}
                className={`flex items-start gap-2 px-2.5 py-1 rounded text-[11px] ${
                  diag.severity === 'error'
                    ? 'bg-red-950/30 text-red-300 border border-red-800/40'
                    : 'bg-amber-950/30 text-amber-300 border border-amber-800/40'
                }`}
              >
                <span className="font-semibold px-1 py-0.2 rounded bg-black/40 text-slate-300">
                  Line {diag.line}
                </span>
                <span className="font-medium text-slate-400">[{diag.code}]</span>
                <span className="flex-1">{diag.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
