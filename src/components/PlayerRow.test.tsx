// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerRow from './PlayerRow';

describe('PlayerRow', () => {
  const mockUpdatePlayerName = vi.fn();
  const mockStartCalibration = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = {
      updatePlayerName: mockUpdatePlayerName,
      startCalibration: mockStartCalibration,
    };
  });

  it('renders unmapped player correctly', () => {
    const player = { id: 1, name: 'Alice', devicePath: null };
    render(<PlayerRow player={player} calibrationTarget={null} />);

    expect(screen.getByText('Player 1:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByText('Map Buzzer')).toBeInTheDocument();
    expect(screen.getByText('• No Device')).toBeInTheDocument();
  });

  it('renders mapped player correctly', () => {
    const player = { id: 2, name: 'Bob', devicePath: '/dev/hidraw1' };
    render(<PlayerRow player={player} calibrationTarget={null} />);

    expect(screen.getByText('Player 2:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    expect(screen.getByText('Mapped (Remap)')).toBeInTheDocument();
    expect(screen.getByText('✓ Ready')).toBeInTheDocument();
  });

  it('calls updatePlayerName when text input changes', () => {
    const player = { id: 1, name: 'Alice', devicePath: null };
    render(<PlayerRow player={player} calibrationTarget={null} />);

    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Alicia' } });

    expect(mockUpdatePlayerName).toHaveBeenCalledWith(1, 'Alicia');
  });

  it('calls startCalibration when map button is clicked', () => {
    const player = { id: 1, name: 'Alice', devicePath: null };
    render(<PlayerRow player={player} calibrationTarget={null} />);

    const button = screen.getByText('Map Buzzer');
    fireEvent.click(button);

    expect(mockStartCalibration).toHaveBeenCalledWith(1);
  });

  it('disables map button when calibrationTarget is not null', () => {
    const player = { id: 1, name: 'Alice', devicePath: null };
    // calibrationTarget is 2, meaning someone else is calibrating
    render(<PlayerRow player={player} calibrationTarget={2} />);

    const button = screen.getByText('Map Buzzer');
    expect(button).toBeDisabled();
  });

  it('enables map button when calibrationTarget is null', () => {
    const player = { id: 1, name: 'Alice', devicePath: null };
    render(<PlayerRow player={player} calibrationTarget={null} />);

    const button = screen.getByText('Map Buzzer');
    expect(button).not.toBeDisabled();
  });
});
