/**
 * ByteLab Main Workbench Component
 * Integrates Top Bar, Monaco Assembly Editor, CPU Dashboard, Memory Inspector, and Output Console.
 */

import React from 'react';
import { useCpuWorkbench } from '../hooks/useCpuWorkbench';
import { Header } from './Header';
import { AssemblyEditor } from './Editor/AssemblyEditor';
import { CpuDashboard } from './CpuDashboard/CpuDashboard';
import { MemoryInspector } from './MemoryInspector/MemoryInspector';
import { OutputConsole } from './Console/OutputConsole';

export const Workbench: React.FC = () => {
  const {
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
  } = useCpuWorkbench('fibonacci');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-slate-100 overflow-hidden select-none">
      {/* Top Bar Header */}
      <Header
        status={state.status}
        isDirty={state.isDirty}
        speedMs={state.speedMs}
        onAssemble={assembleProgram}
        onStep={step}
        onRun={run}
        onPause={pause}
        onReset={reset}
        onSpeedChange={setSpeedMs}
        onSelectExample={loadExample}
      />

      {/* Main Workspace Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Assembly Editor (5 cols on lg) */}
        <section className="lg:col-span-5 h-full flex flex-col min-h-0">
          <AssemblyEditor
            code={state.sourceCode}
            onChange={updateSourceCode}
            activeSourceLine={state.activeSourceLine}
            diagnostics={state.assemblyResult?.diagnostics ?? []}
            isDirty={state.isDirty}
          />
        </section>

        {/* Right Column: CPU Dashboard, Memory, and Console (7 cols on lg) */}
        <section className="lg:col-span-7 h-full flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Top: CPU Register & ALU Flag Dashboard */}
          <div className="shrink-0">
            <CpuDashboard
              cpuState={state.cpuState}
              previousCpuState={state.previousCpuState}
            />
          </div>

          {/* Bottom Split: Memory Inspector (flex-1) & Output Console (shrink-0) */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[300px]">
            {/* Memory Inspector (7 cols on xl) */}
            <div className="xl:col-span-7 h-full min-h-[260px]">
              <MemoryInspector
                dataMemory={state.cpuState.dataMemory}
                prevDataMemory={state.previousCpuState?.dataMemory}
                stackPointer={state.cpuState.specialRegisters.SP}
                selectedAddress={state.selectedMemoryAddress}
                onSelectAddress={setSelectedMemoryAddress}
              />
            </div>

            {/* Output Console (5 cols on xl) */}
            <div className="xl:col-span-5 h-full min-h-[200px]">
              <OutputConsole logs={state.logs} onClear={clearLogs} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
