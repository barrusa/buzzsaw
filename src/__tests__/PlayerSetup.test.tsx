// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlayerSetup } from '../App';

// Mock window.electronAPI
const mockElectronAPI = {
  updatePlayerName: vi.fn(),
  startCalibration: vi.fn(),
  cancelCalibration: vi.fn(),
};

describe('PlayerSetup', () => {
  beforeEach(() => {
    // Inject the mock into the global window object
    (window as any).electronAPI = mockElectronAPI;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockPlayers = [
    { id: 1, name: 'Alice', devicePath: null },
    { id: 2, name: 'Bob', devicePath: '/dev/hidraw0' },
  ];

  it('renders players with their mapped/unmapped status', () => {
    render(<PlayerSetup players={mockPlayers} calibrationTarget={null} />);

    // Check if player names are rendered in the input fields
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();

    // Check mapping buttons
    const mapButtons = screen.getAllByRole('button', { name: /map buzzer/i });
    expect(mapButtons).toHaveLength(1); // Only Alice is unmapped

    const mappedButtons = screen.getAllByRole('button', { name: /mapped \(remap\)/i });
    expect(mappedButtons).toHaveLength(1); // Bob is mapped

    // Check status text
    expect(screen.getByText('• No Device')).toBeInTheDocument(); // Alice
    expect(screen.getByText('✓ Ready')).toBeInTheDocument();     // Bob
  });

  it('triggers updatePlayerName when name input changes', () => {
    render(<PlayerSetup players={mockPlayers} calibrationTarget={null} />);

    const aliceInput = screen.getByDisplayValue('Alice');
    fireEvent.change(aliceInput, { target: { value: 'Alicia' } });

    expect(mockElectronAPI.updatePlayerName).toHaveBeenCalledWith(1, 'Alicia');
  });

  it('triggers startCalibration when Map Buzzer is clicked', () => {
    render(<PlayerSetup players={mockPlayers} calibrationTarget={null} />);

    const mapButton = screen.getByRole('button', { name: /map buzzer/i });
    fireEvent.click(mapButton);

    expect(mockElectronAPI.startCalibration).toHaveBeenCalledWith(1);
  });

  it('displays calibration prompt and triggers cancelCalibration when Cancel is clicked', () => {
    render(<PlayerSetup players={mockPlayers} calibrationTarget={2} />);

    expect(screen.getByText('Press the buzzer for Player 2 now...')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockElectronAPI.cancelCalibration).toHaveBeenCalledTimes(1);
  });

  it('disables mapping buttons when calibrationTarget is set', () => {
    render(<PlayerSetup players={mockPlayers} calibrationTarget={2} />);

    const mapButton = screen.getByRole('button', { name: /map buzzer/i });
    expect(mapButton).toBeDisabled();

    const mappedButton = screen.getByRole('button', { name: /mapped \(remap\)/i });
    expect(mappedButton).toBeDisabled();
  });
});