import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Workbench } from '../Workbench';

describe('ByteLab Workbench UI', () => {
  it('renders the complete workbench layout', () => {
    render(<Workbench />);

    // Brand and Header controls
    expect(screen.getByText('ByteLab')).toBeInTheDocument();
    expect(screen.getByText('BL-8 CPU Workbench')).toBeInTheDocument();
    expect(screen.getByTestId('assemble-btn')).toBeInTheDocument();
    expect(screen.getByTestId('step-btn')).toBeInTheDocument();
    expect(screen.getByTestId('run-btn')).toBeInTheDocument();
    expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();

    // Editor & Panels
    expect(screen.getByText('BL-8 Assembly Editor')).toBeInTheDocument();
    expect(screen.getByTestId('assembly-editor-textarea')).toBeInTheDocument();

    // CPU Dashboard
    expect(screen.getByText('BL-8 CPU Architecture')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-A')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-B')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-C')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-D')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-PC')).toBeInTheDocument();
    expect(screen.getByTestId('register-card-SP')).toBeInTheDocument();
    expect(screen.getByTestId('flag-badge-Z')).toBeInTheDocument();
    expect(screen.getByTestId('flag-badge-C')).toBeInTheDocument();
    expect(screen.getByTestId('flag-badge-N')).toBeInTheDocument();

    // Memory Inspector & Console
    expect(screen.getByText('Data Memory (256 Bytes RAM)')).toBeInTheDocument();
    expect(screen.getByTestId('selected-cell-inspector')).toBeInTheDocument();
    expect(screen.getByText('Output Console')).toBeInTheDocument();
  });

  it('allows editing source code and marks code as dirty', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'LDI A, 42\nHLT' } });
    expect(textarea.value).toBe('LDI A, 42\nHLT');
    expect(screen.getByTestId('dirty-badge')).toBeInTheDocument();
  });

  it('assembles a valid program and enables execution controls', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'LDI A, 10\nOUT A\nHLT' } });

    const assembleBtn = screen.getByTestId('assemble-btn');
    fireEvent.click(assembleBtn);

    // Status badge reflects assembled state
    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveTextContent(/assembled/i);

    // Step button becomes enabled
    const stepBtn = screen.getByTestId('step-btn');
    expect(stepBtn).not.toBeDisabled();
  });

  it('executes exactly one instruction on Step and updates CPU dashboard', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'LDI A, 77\nHLT' } });

    // Assemble
    fireEvent.click(screen.getByTestId('assemble-btn'));

    // Initial PC is 0, A is 0
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('0');
    expect(screen.getByTestId('register-card-PC')).toHaveTextContent('0');

    // Step 1: executes LDI A, 77
    const stepBtn = screen.getByTestId('step-btn');
    fireEvent.click(stepBtn);

    // A should now be 77, PC should now be 1
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('77');
    expect(screen.getByTestId('register-card-PC')).toHaveTextContent('1');
    expect(screen.getByTestId('ir-instruction-text')).toHaveTextContent('LDI');

    // Step 2: executes HLT
    fireEvent.click(stepBtn);
    expect(screen.getByTestId('status-badge')).toHaveTextContent(/halted/i);
    // After HLT, step button should be disabled
    expect(stepBtn).toBeDisabled();
  });

  it('reflects memory changes in the memory inspector', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, {
      target: { value: 'LDI A, 0xAB\nSTORE [0x15], A\nHLT' },
    });

    fireEvent.click(screen.getByTestId('assemble-btn'));
    const stepBtn = screen.getByTestId('step-btn');

    // Step 1: LDI A, 0xAB
    fireEvent.click(stepBtn);
    // Step 2: STORE [0x15], A (0x15 is decimal 21)
    fireEvent.click(stepBtn);

    // Memory cell 21 should now display 'AB'
    const cell21 = screen.getByTestId('memory-cell-21');
    expect(cell21).toHaveTextContent('AB');

    // Clicking cell 21 should update selected cell inspector
    fireEvent.click(cell21);
    const inspector = screen.getByTestId('selected-cell-inspector');
    expect(inspector).toHaveTextContent('0x15 (21)');
    expect(inspector).toHaveTextContent('0xAB');
    expect(inspector).toHaveTextContent('171');
  });

  it('displays OUT values in the output console and supports clearing logs', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, {
      target: { value: 'LDI A, 99\nOUT A\nHLT' },
    });

    fireEvent.click(screen.getByTestId('assemble-btn'));
    const stepBtn = screen.getByTestId('step-btn');

    // Step 1: LDI A, 99
    fireEvent.click(stepBtn);
    // Step 2: OUT A
    fireEvent.click(stepBtn);

    const logList = screen.getByTestId('console-log-list');
    expect(logList).toHaveTextContent('OUT: 99');

    // Clear console
    const clearBtn = screen.getByTestId('clear-console-btn');
    fireEvent.click(clearBtn);
    expect(screen.getByText(/No output emitted yet/i)).toBeInTheDocument();
  });

  it('displays diagnostics for invalid assembly and prevents execution', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, {
      target: { value: 'INVALID_OPCODE A, B\nHLT' },
    });

    fireEvent.click(screen.getByTestId('assemble-btn'));

    // Diagnostics panel should appear
    expect(screen.getByTestId('diagnostics-panel')).toBeInTheDocument();
    expect(screen.getByText(/UNKNOWN_MNEMONIC/i)).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent(/error/i);

    // Step button should remain disabled
    expect(screen.getByTestId('step-btn')).toBeDisabled();
  });

  it('prevents executing stale program after editing source code until re-assembled', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'LDI A, 1\nHLT' } });

    // Assemble program
    fireEvent.click(screen.getByTestId('assemble-btn'));
    expect(screen.getByTestId('step-btn')).not.toBeDisabled();

    // Now modify the source without re-assembling
    fireEvent.change(textarea, { target: { value: 'LDI A, 2\nHLT' } });
    expect(screen.getByTestId('dirty-badge')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent(/source modified/i);

    // Step button should be disabled to prevent executing stale program
    expect(screen.getByTestId('step-btn')).toBeDisabled();
  });

  it('resets CPU state back to initial values when Reset button is clicked', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'LDI A, 55\nHLT' } });

    fireEvent.click(screen.getByTestId('assemble-btn'));
    fireEvent.click(screen.getByTestId('step-btn'));

    expect(screen.getByTestId('register-card-A')).toHaveTextContent('55');
    expect(screen.getByTestId('register-card-PC')).toHaveTextContent('1');

    // Click Reset
    fireEvent.click(screen.getByTestId('reset-btn'));

    expect(screen.getByTestId('register-card-A')).toHaveTextContent('0');
    expect(screen.getByTestId('register-card-PC')).toHaveTextContent('0');
    expect(screen.getByTestId('status-badge')).toHaveTextContent(/assembled/i);
  });

  it('loads a different preset program when selected from dropdown', () => {
    render(<Workbench />);
    const select = screen.getByTestId('program-select');

    fireEvent.change(select, { target: { value: 'counter' } });
    const textarea = screen.getByTestId('assembly-editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Countdown Loop');
  });
});
