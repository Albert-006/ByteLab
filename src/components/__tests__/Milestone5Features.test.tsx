import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Workbench } from '../Workbench';

describe('Milestone 5: Breakpoints, Watchpoints, and Import/Export', () => {
  it('toggles breakpoints on source lines', () => {
    render(<Workbench />);

    // Toggle breakpoint on line 2 using the test helper button
    const toggleBpBtn = screen.getByTestId('test-toggle-bp-btn');
    fireEvent.click(toggleBpBtn);

    // Verify breakpoint badge appears in editor header
    expect(screen.getByTestId('breakpoints-badge')).toHaveTextContent('1 BP');

    // Toggle again to remove
    fireEvent.click(toggleBpBtn);
    expect(screen.queryByTestId('breakpoints-badge')).not.toBeInTheDocument();
  });

  it('toggles watchpoints on data memory addresses', () => {
    render(<Workbench />);

    // Select memory cell 16 (0x10)
    const cell16 = screen.getByTestId('memory-cell-16');
    fireEvent.click(cell16);

    // Click Watch button
    const watchBtn = screen.getByTestId('toggle-watchpoint-btn');
    expect(watchBtn).toHaveTextContent('Watch');
    fireEvent.click(watchBtn);

    // Watchpoints badge should appear and button changes to Watching
    expect(screen.getByTestId('watchpoints-badge')).toHaveTextContent('1 Watched');
    expect(watchBtn).toHaveTextContent('Watching');

    // Toggle again to unwatch
    fireEvent.click(watchBtn);
    expect(screen.queryByTestId('watchpoints-badge')).not.toBeInTheDocument();
  });

  it('handles source export as .asm file', () => {
    render(<Workbench />);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const exportBtn = screen.getByTestId('export-asm-btn');
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('imports valid assembly file into the editor', async () => {
    render(<Workbench />);

    const fileContent = 'LDI A, 99\nOUT A\nHLT';
    const file = new File([fileContent], 'custom.asm', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const textarea = screen.getByTestId('assembly-editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(fileContent);
    });
  });
});
