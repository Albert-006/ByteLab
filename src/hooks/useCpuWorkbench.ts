/**
 * useCpuWorkbench Hook
 * Manages reactive interaction between editor source, assembler, and BL-8 CPU engine.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { assemble } from '../core/assembler';
import { Cpu } from '../core/cpu';
import { AssemblyResult } from '../core/types/assembler.types';
import { CpuState } from '../core/types/cpu.types';
import { ConsoleLogEntry, WorkbenchState, WorkbenchStatus } from '../types/workbench.types';
import { EXAMPLE_PROGRAMS } from '../examples/programs';

export function useCpuWorkbench(initialProgramId: string = 'fibonacci') {
  const initialProgram =
    EXAMPLE_PROGRAMS.find((p) => p.id === initialProgramId) ?? EXAMPLE_PROGRAMS[0];

  const cpuRef = useRef<Cpu>(new Cpu());
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

  // Update source text and mark program dirty
  const updateSourceCode = useCallback((newSource: string) => {
    setSourceCode(newSource);
    setIsDirty(true);
  }, []);

  // Assemble code and load into CPU
  const assembleProgram = useCallback(() => {
    // Stop any running loop
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const result = assemble(sourceCode);
    setAssemblyResult(result);

    if (result.success) {
      cpuRef.current.loadProgram(result.instructions);
      const newState = cpuRef.current.getState();
      setCpuState(newState);
      setPreviousCpuState(null);
      setIsDirty(false);
      setStatus('assembled');

      // Highlight first instruction's source line
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

  // Execute exactly one instruction step
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

    const prev = cpuRef.current.getState();
    const prevOutputLength = prev.output.length;

    const result = cpuRef.current.step();
    const nextState = result.state;

    setPreviousCpuState(prev);
    setCpuState(nextState);

    // Check if new output was produced
    if (nextState.output.length > prevOutputLength) {
      const newlyEmitted = nextState.output[nextState.output.length - 1];
      addLog('out', `OUT: ${newlyEmitted} (0x${newlyEmitted.toString(16).toUpperCase().padStart(2, '0')})`, newlyEmitted);
    }

    // Update active source line based on PC
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
  }, [isDirty, status, assemblyResult, addLog]);

  // Run automatically on interval
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

  // Interval execution when status === 'running'
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        step();
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
  }, [status, speedMs, step]);

  // Reset CPU state to initial for loaded program
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
      addLog('info', 'CPU reset to initial state (PC=0, SP=255, registers & RAM cleared).');
    } else {
      cpuRef.current.reset();
      setCpuState(cpuRef.current.getState());
      setPreviousCpuState(null);
      setStatus('idle');
      setActiveSourceLine(null);
      addLog('info', 'CPU reset.');
    }
  }, [assemblyResult, addLog]);

  // Load a preset program
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
      addLog('info', `Loaded example program: "${example.name}". Click "Assemble" to prepare.`);
    },
    [addLog]
  );

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
  };

  return {
    state,
    updateSourceCode,
    assembleProgram,
    step,
    run,
    pause,
    reset,
    setSpeedMs,
    setSelectedMemoryAddress,
    clearLogs,
    loadExample,
  };
}
