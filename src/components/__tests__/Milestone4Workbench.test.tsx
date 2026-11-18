import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Workbench } from '../Workbench';

describe('ByteLab Milestone 4: CPU Flow, ALU Panel & Time Travel Debugger UI', () => {
  it('renders Timeline Navigator, CPU Flow View, and ALU Panel', () => {
    render(<Workbench />);

    expect(screen.getByTestId('timeline-navigator')).toBeInTheDocument();
    expect(screen.getByTestId('cpu-flow-view')).toBeInTheDocument();
    expect(screen.getByTestId('alu-panel-idle')).toBeInTheDocument();
    expect(screen.getByTestId('flow-pc')).toBeInTheDocument();
    expect(screen.getByTestId('flow-program-memory')).toBeInTheDocument();
    expect(screen.getByTestId('flow-ir')).toBeInTheDocument();
    expect(screen.getByTestId('flow-control-unit')).toBeInTheDocument();
    expect(screen.getByTestId('flow-register-bank')).toBeInTheDocument();
    expect(screen.getByTestId('flow-alu')).toBeInTheDocument();
    expect(screen.getByTestId('flow-data-memory')).toBeInTheDocument();
    expect(screen.getByTestId('flow-output')).toBeInTheDocument();
  });

  it('updates ALU panel and CPU Flow when executing arithmetic instructions', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, {
      target: { value: 'LDI A, 25\nLDI B, 15\nADD A, B\nHLT' },
    });

    fireEvent.click(screen.getByTestId('assemble-btn'));
    const stepBtn = screen.getByTestId('step-btn');

    // Step 1: LDI A, 25 (non-ALU, ALU panel is idle)
    fireEvent.click(stepBtn);
    expect(screen.getByTestId('alu-panel-idle')).toBeInTheDocument();

    // Step 2: LDI B, 15 (non-ALU)
    fireEvent.click(stepBtn);

    // Step 3: ADD A, B (ALU instruction!)
    fireEvent.click(stepBtn);

    // ALU panel should now be active
    const aluPanel = screen.getByTestId('alu-panel-active');
    expect(aluPanel).toBeInTheDocument();
    expect(within(aluPanel).getByTestId('alu-op-badge')).toHaveTextContent('ADD');
    expect(within(aluPanel).getByText('40')).toBeInTheDocument(); // 25 + 15 = 40

    // Path description should reflect the addition
    expect(screen.getByTestId('flow-path-description')).toHaveTextContent(/ADD A\(25\) \+ B\(15\) = 40/);
  });

  it('supports Time Travel navigation (step backward, forward, and jump)', () => {
    render(<Workbench />);
    const textarea = screen.getByTestId('assembly-editor-textarea');
    fireEvent.change(textarea, {
      target: { value: 'LDI A, 10\nLDI B, 20\nADD A, B\nOUT A\nHLT' },
    });

    fireEvent.click(screen.getByTestId('assemble-btn'));
    const stepBtn = screen.getByTestId('step-btn');

    // Execute 3 steps: LDI A, LDI B, ADD A, B
    fireEvent.click(stepBtn);
    fireEvent.click(stepBtn);
    fireEvent.click(stepBtn);

    // Currently at Step 3: A=30, B=20
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('30');
    expect(screen.getByTestId('timeline-live-badge')).toBeInTheDocument();

    // Step backward using header Back button
    const stepBackBtn = screen.getByTestId('step-back-btn');
    fireEvent.click(stepBackBtn);

    // Now at Step 2: A was 10, B was 20 (before ADD)
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('10');
    expect(screen.getByTestId('timeline-timetravel-badge')).toBeInTheDocument();

    // Step backward again to Step 1: A was 10, B was 0
    fireEvent.click(stepBackBtn);
    expect(screen.getByTestId('register-card-B')).toHaveTextContent('0');

    // Step backward to Step 0 (initial baseline): A=0, B=0
    fireEvent.click(stepBackBtn);
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('0');
    expect(stepBackBtn).toBeDisabled(); // Cannot step back before step 0

    // Forward navigation through existing history using Timeline Forward button
    const forwardBtn = screen.getByTestId('timeline-forward-btn');
    fireEvent.click(forwardBtn); // To Step 1
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('10');

    // Jump directly to Step 3 using step micro-pill
    const pill3 = screen.getByTestId('timeline-step-pill-3');
    fireEvent.click(pill3);
    expect(screen.getByTestId('register-card-A')).toHaveTextContent('30');
    expect(screen.getByTestId('timeline-live-badge')).toBeInTheDocument();
  });
});
