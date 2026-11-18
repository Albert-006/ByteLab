/**
 * useCpuWorkbench Hook
 * Manages reactive interaction between editor source, assembler, BL-8 CPU engine,
 * Execution History / Time Travel Debugger, Breakpoints, and Watchpoints.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { assemble } from '../core/assembler';
import { Cpu } from '../core/cpu';
import { ExecutionHistoryManager } from '../core/debugger/history';
import { TimelineSummary } from '../core/debugger/types';
import { AssemblyResult } from '../core/types/assembler.types';
import {
  AluOperationMetadata,
  CpuFlowHighlight,
  CpuState,
} from '../core/types/cpu.types';
import { ConsoleLogEntry, WorkbenchState, WorkbenchStatus } from '../types/workbench.types';
import { EXAMPLE_PROGRAMS } from '../examples/programs';

export function useCpuWorkbench(initialProgramId: string = 'fibonacci') {
  const initialProgram =
    EXAMPLE_PROGRAMS.find((p) => p.id === initialProgramId) ?? EXAMPLE_PROGRAMS[0];

  const cpuRef = useRef<Cpu>(new Cpu());
  const historyRef = useRef<ExecutionHistoryManager>(new ExecutionHistoryManager(10_000));
  const timerRef = useRef<number | null>(null);

  const [sourceCode, setSourceCode] = useState<string>(initialProgram.code);
  const [isDirty, setIsDirty] = useState<boolean>(true);
  const [assemblyResult, setAssemblyResult] = useState<AssemblyResult | null>(null);
  const [cpuState, setCpuState] = useState<CpuState>(cpuRef.current.getState());
  const [previousCpuState, setPreviousCpuState] = useState<CpuState | null>(null);
  const [status, setStatus] = useState<WorkbenchStatus>('idle');
  const [speedMs, setSpeedMs] = useState<number>(200);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    {
      id: 'init-1',
      timestamp: Date.now(),
      type: 'info',
      message: 'ByteLab BL-8 CPU Workbench initialized. Click "Assemble" to prepare program.',
    },
  ]);
  const [selectedMemoryAddress, setSelectedMemoryAddress] = useState<number>(0);
  const [activeSourceLine, setActiveSourceLine] = useState<number | null>(null);

  // Milestone 4 & 5: ALU Metadata, Flow Highlights, Timeline, Breakpoints & Watchpoints
  const [aluOperation, setAluOperation] = useState<AluOperationMetadata | undefined>(undefined);
  const [flowHighlight, setFlowHighlight] = useState<CpuFlowHighlight | undefined>(undefined);
  const [timelineSummary, setTimelineSummary] = useState<TimelineSummary>({
    currentStep: 0,
    totalSteps: 0,
    isAtLatest: true,
    canStepBackward: false,
    canStepForward: false,
  });

  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [watchpoints, setWatchpoints] = useState<Set<number>>(new Set());

  const addLog = useCallback(
    (type: ConsoleLogEntry['type'], message: string, value?: number) => {
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type,
          message,
          value,
        },
      ]);
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const updateSourceCode = useCallback((newSource: string) => {
    setSourceCode(newSource);
    setIsDirty(true);
  }, []);

  // Breakpoints & Watchpoints toggles
  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  }, []);

  const toggleWatchpoint = useCallback((address: number) => {
    setWatchpoints((prev) => {
      const next = new Set(prev);
      if (next.has(address)) {
        next.delete(address);
      } else {
        next.add(address);
      }
      return next;
    });
  }, []);

  // Assemble code, reset CPU, and initialize baseline history snapshot (Step 0)
  const assembleProgram = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const result = assemble(sourceCode);
    setAssemblyResult(result);

    if (result.success) {
      cpuRef.current.loadProgram(result.instructions);
      const initialState = cpuRef.current.getState();
      setCpuState(initialState);
      setPreviousCpuState(null);
      setIsDirty(false);
      setStatus('assembled');

      // Initialize history manager with baseline state (Step 0)
      historyRef.current.init(initialState);
      setTimelineSummary(historyRef.current.getTimelineSummary());
      setAluOperation(undefined);
      setFlowHighlight(undefined);

      const firstLine = result.sourceMap[0] ?? null;
      setActiveSourceLine(firstLine);

      addLog(
        'success',
        `Assembled successfully: ${result.instructions.length} instruction(s), 0 errors.`
      );
    } else {
      setIsDirty(false);
      setStatus('error');
      addLog(
        'error',
        `Assembly failed with ${result.diagnostics.length} diagnostic error(s). Review editor lines.`
      );
    }
  }, [sourceCode, addLog]);

  // Execute one forward instruction step (or step through existing history)
  const step = useCallback(() => {
    if (isDirty) {
      addLog('error', 'Cannot step: source code was modified. Please re-assemble first.');
      return;
    }

    if (status === 'halted') {
      addLog('info', 'CPU is already halted. Reset or assemble to run again.');
      return;
    }

    if (status === 'error') {
      addLog('error', 'CPU is in an error state. Reset to clear.');
      return;
    }

    // If currently viewing history in the past and stepping forward through existing snapshots:
    if (historyRef.current.canStepForwardHistory()) {
      const snap = historyRef.current.stepForwardHistory();
      if (snap) {
        cpuRef.current.loadState(snap.cpuState);
        setCpuState(snap.cpuState);
        setAluOperation(snap.aluOperation);
        setFlowHighlight(snap.flowHighlight);
        setTimelineSummary(historyRef.current.getTimelineSummary());

        if (assemblyResult) {
          const nextLine = assemblyResult.sourceMap[snap.cpuState.specialRegisters.PC] ?? null;
          setActiveSourceLine(nextLine);
        }
        return;
      }
    }

    // Otherwise, execute a new instruction step on the engine
    const prev = cpuRef.current.getState();
    const prevOutputLength = prev.output.length;

    const result = cpuRef.current.step();
    const nextState = result.state;

    setPreviousCpuState(prev);
    setCpuState(nextState);
    setAluOperation(result.aluOperation);
    setFlowHighlight(result.flowHighlight);

    // Record snapshot into history manager (auto-truncates future branch if previously in past)
    historyRef.current.recordStep(
      nextState,
      result.instruction,
      result.aluOperation,
      result.flowHighlight
    );
    setTimelineSummary(historyRef.current.getTimelineSummary());

    // Check watchpoint triggers
    if (watchpoints.size > 0) {
      for (const addr of watchpoints) {
        if (prev.dataMemory[addr] !== nextState.dataMemory[addr]) {
          addLog(
            'info',
            `[Watchpoint Triggered] RAM[0x${addr.toString(16).toUpperCase()}] changed from ${prev.dataMemory[addr]} to ${nextState.dataMemory[addr]}`
          );
        }
      }
    }

    if (nextState.output.length > prevOutputLength) {
      const newlyEmitted = nextState.output[nextState.output.length - 1];
      addLog('out', `OUT: ${newlyEmitted} (0x${newlyEmitted.toString(16).toUpperCase().padStart(2, '0')})`, newlyEmitted);
    }

    if (assemblyResult) {
      const nextLine = assemblyResult.sourceMap[nextState.specialRegisters.PC] ?? null;
      setActiveSourceLine(nextLine);
    }

    if (result.error) {
      setStatus('error');
      addLog('error', `Runtime Error: [${result.error.code}] ${result.error.message} (at PC=${result.error.pc})`);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (result.halted) {
      setStatus('halted');
      addLog('halt', `CPU halted at PC=${nextState.specialRegisters.PC} after ${nextState.cycleCount} cycles.`);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setStatus((s) => (s === 'running' ? 'running' : 'paused'));
    }
  }, [isDirty, status, assemblyResult, watchpoints, addLog]);

  // Step backward in history
  const stepBackward = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const snap = historyRef.current.stepBackward();
    if (snap) {
      cpuRef.current.loadState(snap.cpuState);
      setCpuState(snap.cpuState);
      setAluOperation(snap.aluOperation);
      setFlowHighlight(snap.flowHighlight);
      setTimelineSummary(historyRef.current.getTimelineSummary());
      setStatus(snap.cpuState.status === 'idle' ? 'assembled' : snap.cpuState.status);

      if (assemblyResult) {
        const line = assemblyResult.sourceMap[snap.cpuState.specialRegisters.PC] ?? null;
        setActiveSourceLine(line);
      }
    }
  }, [assemblyResult]);

  // Jump directly to an arbitrary step in history
  const jumpToStep = useCallback(
    (targetStep: number) => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const snap = historyRef.current.jumpToStep(targetStep);
      if (snap) {
        cpuRef.current.loadState(snap.cpuState);
        setCpuState(snap.cpuState);
        setAluOperation(snap.aluOperation);
        setFlowHighlight(snap.flowHighlight);
        setTimelineSummary(historyRef.current.getTimelineSummary());
        setStatus(snap.cpuState.status === 'idle' ? 'assembled' : snap.cpuState.status);

        if (assemblyResult) {
          const line = assemblyResult.sourceMap[snap.cpuState.specialRegisters.PC] ?? null;
          setActiveSourceLine(line);
        }
      }
    },
    [assemblyResult]
  );

  const run = useCallback(() => {
    if (isDirty) {
      addLog('error', 'Cannot run: source code was modified. Please re-assemble first.');
      return;
    }

    if (status === 'halted') {
      addLog('info', 'CPU is halted. Reset to run again.');
      return;
    }

    if (status === 'error') {
      addLog('error', 'CPU is in an error state. Reset to clear.');
      return;
    }

    setStatus('running');
    addLog('info', `CPU execution running at ${(1000 / speedMs).toFixed(1)} Hz...`);
  }, [isDirty, status, speedMs, addLog]);

  const pause = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (status === 'running') {
      setStatus('paused');
      addLog('info', 'CPU execution paused.');
    }
  }, [status, addLog]);

  // Run timer with Breakpoint and Watchpoint checking
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        // Check if next instruction is at a breakpoint
        const currentPC = cpuRef.current.getState().specialRegisters.PC;
        const currentLine = assemblyResult?.sourceMap[currentPC];
        if (currentLine && breakpoints.has(currentLine)) {
          // Pause before executing breakpoint line!
          pause();
          addLog('info', `[Breakpoint Hit] Execution paused at line ${currentLine} (PC = ${currentPC}).`);
          return;
        }

        const prevMem = cpuRef.current.getState().dataMemory;
        step();

        // Check watchpoints after step
        if (watchpoints.size > 0) {
          const nextMem = cpuRef.current.getState().dataMemory;
          for (const addr of watchpoints) {
            if (prevMem[addr] !== nextMem[addr]) {
              pause();
              addLog(
                'info',
                `[Watchpoint Hit] Paused: RAM[0x${addr.toString(16).toUpperCase()}] changed to ${nextMem[addr]}.`
              );
              break;
            }
          }
        }
      }, speedMs);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, speedMs, breakpoints, watchpoints, assemblyResult, step, pause, addLog]);

  const reset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (assemblyResult?.success) {
      cpuRef.current.loadProgram(assemblyResult.instructions);
      const resetState = cpuRef.current.getState();
      setCpuState(resetState);
      setPreviousCpuState(null);
      setStatus('assembled');
      setActiveSourceLine(assemblyResult.sourceMap[0] ?? null);

      historyRef.current.init(resetState);
      setTimelineSummary(historyRef.current.getTimelineSummary());
      setAluOperation(undefined);
      setFlowHighlight(undefined);

      addLog('info', 'CPU reset to initial state (PC=0, SP=255, registers & RAM cleared).');
    } else {
      cpuRef.current.reset();
      const resetState = cpuRef.current.getState();
      setCpuState(resetState);
      setPreviousCpuState(null);
      setStatus('idle');
      setActiveSourceLine(null);

      historyRef.current.init(resetState);
      setTimelineSummary(historyRef.current.getTimelineSummary());
      setAluOperation(undefined);
      setFlowHighlight(undefined);

      addLog('info', 'CPU reset.');
    }
  }, [assemblyResult, addLog]);

  const loadExample = useCallback(
    (exampleId: string) => {
      const example = EXAMPLE_PROGRAMS.find((p) => p.id === exampleId);
      if (!example) return;

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setSourceCode(example.code);
      setIsDirty(true);
      setStatus('idle');
      setActiveSourceLine(null);
      setAluOperation(undefined);
      setFlowHighlight(undefined);
      addLog('info', `Loaded example program: "${example.name}". Click "Assemble" to prepare.`);
    },
    [addLog]
  );

  // File Import & Export
  const exportSourceFile = useCallback((fileName: string = 'program.asm') => {
    try {
      const blob = new Blob([sourceCode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.asm') ? fileName : `${fileName}.asm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog('success', `Exported source code to ${link.download}.`);
    } catch (err) {
      addLog('error', `Failed to export file: ${(err as Error).message}`);
    }
  }, [sourceCode, addLog]);

  const importSourceFile = useCallback((file: File) => {
    if (!file.name.endsWith('.asm') && !file.name.endsWith('.txt')) {
      addLog('error', `Cannot import '${file.name}': only .asm or .txt assembly files are supported.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (typeof content === 'string') {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setSourceCode(content);
        setIsDirty(true);
        setStatus('idle');
        setActiveSourceLine(null);
        addLog('success', `Imported '${file.name}' (${content.split('\n').length} lines). Click "Assemble" to build.`);
      }
    };
    reader.onerror = () => {
      addLog('error', `Error reading file '${file.name}'.`);
    };
    reader.readAsText(file);
  }, [addLog]);

  const state: WorkbenchState = {
    sourceCode,
    isDirty,
    assemblyResult,
    cpuState,
    previousCpuState,
    status,
    speedMs,
    logs,
    selectedMemoryAddress,
    activeSourceLine,
    error: cpuState.error,
    breakpoints,
    watchpoints,
  };

  return {
    state,
    aluOperation,
    flowHighlight,
    timelineSummary,
    snapshots: historyRef.current.getAllSnapshots(),
    updateSourceCode,
    assembleProgram,
    step,
    stepBackward,
    jumpToStep,
    run,
    pause,
    reset,
    setSpeedMs,
    setSelectedMemoryAddress,
    toggleBreakpoint,
    toggleWatchpoint,
    clearLogs,
    loadExample,
    exportSourceFile,
    importSourceFile,
  };
}
