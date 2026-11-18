/**
 * ByteLab Main Workbench Component
 * Integrates Top Bar, Monaco Assembly Editor, CPU Dashboard, Datapath Flow View,
 * ALU Panel, Memory Inspector, Output Console, Time Travel Debugger Timeline,
 * Breakpoints, Watchpoints, and Import/Export.
 */

import React from 'react';
import { useCpuWorkbench } from '../hooks/useCpuWorkbench';
import { Header } from './Header';
import { AssemblyEditor } from './Editor/AssemblyEditor';
import { CpuDashboard } from './CpuDashboard/CpuDashboard';
import { MemoryInspector } from './MemoryInspector/MemoryInspector';
import { OutputConsole } from './Console/OutputConsole';
import { CpuFlowView } from './CpuFlow/CpuFlowView';
import { AluPanel } from './Alu/AluPanel';
import { TimelineNavigator } from './Timeline/TimelineNavigator';

export const Workbench: React.FC = () => {
  const {
    state,
    aluOperation,
    flowHighlight,
    timelineSummary,
    snapshots,
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
  } = useCpuWorkbench('fibonacci');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-slate-100 overflow-hidden select-none">
      {/* Top Bar Header */}
      <Header
        status={state.status}
        isDirty={state.isDirty}
        canStepBackward={timelineSummary.canStepBackward}
        speedMs={state.speedMs}
        onAssemble={assembleProgram}
        onStep={step}
        onStepBackward={stepBackward}
        onRun={run}
        onPause={pause}
        onReset={reset}
        onSpeedChange={setSpeedMs}
        onSelectExample={loadExample}
        onExport={() => exportSourceFile('bytelab-program.asm')}
        onImport={importSourceFile}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Assembly Editor & Output Console (5 cols on lg) */}
        <section className="lg:col-span-5 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Assembly Editor */}
          <div className="flex-1 min-h-[320px]">
            <AssemblyEditor
              code={state.sourceCode}
              onChange={updateSourceCode}
              activeSourceLine={state.activeSourceLine}
              diagnostics={state.assemblyResult?.diagnostics ?? []}
              isDirty={state.isDirty}
              breakpoints={state.breakpoints}
              onToggleBreakpoint={toggleBreakpoint}
            />
          </div>

          {/* Output Console */}
          <div className="h-44 shrink-0">
            <OutputConsole logs={state.logs} onClear={clearLogs} />
          </div>
        </section>

        {/* Right Column: Time Travel Timeline, CPU Dashboard, Flow, ALU & Memory (7 cols on lg) */}
        <section className="lg:col-span-7 h-full flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Time Travel Debugger Timeline */}
          <div className="shrink-0">
            <TimelineNavigator
              summary={timelineSummary}
              snapshots={snapshots}
              onStepBackward={stepBackward}
              onStepForward={step}
              onJumpToStep={jumpToStep}
            />
          </div>

          {/* Row: CPU Architecture Dashboard & ALU Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 shrink-0">
            <div className="xl:col-span-8">
              <CpuDashboard
                cpuState={state.cpuState}
                previousCpuState={state.previousCpuState}
              />
            </div>
            <div className="xl:col-span-4 min-h-[220px]">
              <AluPanel aluOperation={aluOperation} />
            </div>
          </div>

          {/* CPU Datapath Flow Visualization */}
          <div className="shrink-0 min-h-[260px]">
            <CpuFlowView
              highlight={flowHighlight}
              cpuState={state.cpuState}
            />
          </div>

          {/* Data Memory Inspector */}
          <div className="min-h-[300px] shrink-0 mb-2">
            <MemoryInspector
              dataMemory={state.cpuState.dataMemory}
              prevDataMemory={state.previousCpuState?.dataMemory}
              stackPointer={state.cpuState.specialRegisters.SP}
              selectedAddress={state.selectedMemoryAddress}
              watchpoints={state.watchpoints}
              onSelectAddress={setSelectedMemoryAddress}
              onToggleWatchpoint={toggleWatchpoint}
            />
          </div>
        </section>
      </main>
    </div>
  );
};
