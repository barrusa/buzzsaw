// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HostWindow } from '../App';

// Mock electronAPI
const mockElectronAPI = {
  openFloor: vi.fn(),
  resetGame: vi.fn(),
  startTimer: vi.fn(),
  requestState: vi.fn(),
  onUpdateState: vi.fn(),
  simulateBuzz: vi.fn(),
  updatePlayerName: vi.fn(),
  startCalibration: vi.fn(),
  cancelCalibration: vi.fn(),
  openBoardWindow: vi.fn(),
  quitApp: vi.fn(),
};

describe('HostWindow', () => {
  beforeEach(() => {
    window.electronAPI = mockElectronAPI;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(<HostWindow />);
  };

  it('renders default state correctly', () => {
    renderComponent();
    expect(screen.getByText('Host Console')).toBeTruthy();
    expect(screen.getByText('IDLE')).toBeTruthy();
    expect(screen.getByText('5s')).toBeTruthy();
    expect(screen.getByText('Waiting for buzz...')).toBeTruthy();
    expect(screen.getByText('None')).toBeTruthy();
  });

  it('calls openBoardWindow when Focus Board is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Focus Board'));
    expect(mockElectronAPI.openBoardWindow).toHaveBeenCalledTimes(1);
  });

  it('calls quitApp when Quit App is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Quit App'));
    expect(mockElectronAPI.quitApp).toHaveBeenCalledTimes(1);
  });

  it('calls openFloor when OPEN BUZZERS is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('OPEN BUZZERS'));
    expect(mockElectronAPI.openFloor).toHaveBeenCalledTimes(1);
  });

  it('calls resetGame when STOP / RESET is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('STOP / RESET'));
    expect(mockElectronAPI.resetGame).toHaveBeenCalledTimes(1);
  });

  it('calls simulateBuzz when Simulate Buzz buttons are clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Simulate Player 1'));
    expect(mockElectronAPI.simulateBuzz).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('Simulate Player 2'));
    expect(mockElectronAPI.simulateBuzz).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText('Simulate Player 3'));
    expect(mockElectronAPI.simulateBuzz).toHaveBeenCalledWith(3);
  });

  it('updates state when onUpdateState callback is triggered', async () => {
    let updateCallback: any;
    mockElectronAPI.onUpdateState.mockImplementation((cb) => {
      updateCallback = cb;
    });

    renderComponent();

    // Trigger update
    await React.act(async () => {
      updateCallback({
        gameState: 'OPEN',
        buzzQueue: [
          { player: 1, timestamp: 123, delta: 0, label: '0.000s' }
        ],
        earlyBuzzers: [2],
        timer: 3,
        players: [
          { id: 1, name: 'Alice', devicePath: null },
          { id: 2, name: 'Bob', devicePath: null }
        ],
        calibrationTarget: null,
      });
    });

    // Check updated render
    expect(screen.getByText('OPEN')).toBeTruthy();
    expect(screen.getByText('3s')).toBeTruthy();

    // Buzz Queue
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('(0.000s)')).toBeTruthy();

    // Locked Out
    expect(screen.getByText('Bob')).toBeTruthy();

    // Player Setup
    expect(screen.getByDisplayValue('Alice')).toBeTruthy();
    expect(screen.getByDisplayValue('Bob')).toBeTruthy();
  });

  it('handles player setup interactions (updatePlayerName, startCalibration, cancelCalibration)', async () => {
    let updateCallback: any;
    mockElectronAPI.onUpdateState.mockImplementation((cb) => {
      updateCallback = cb;
    });

    renderComponent();

    // Inject players
    await React.act(async () => {
      updateCallback({
        gameState: 'IDLE',
        buzzQueue: [],
        earlyBuzzers: [],
        timer: 5,
        players: [
          { id: 1, name: 'Alice', devicePath: null }
        ],
        calibrationTarget: null,
      });
    });

    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Alicia' } });
    expect(mockElectronAPI.updatePlayerName).toHaveBeenCalledWith(1, 'Alicia');

    // Map Buzzer
    fireEvent.click(screen.getByText('Map Buzzer'));
    expect(mockElectronAPI.startCalibration).toHaveBeenCalledWith(1);

    // Inject calibration target
    await React.act(async () => {
      updateCallback({
        gameState: 'IDLE',
        buzzQueue: [],
        earlyBuzzers: [],
        timer: 5,
        players: [
          { id: 1, name: 'Alice', devicePath: null }
        ],
        calibrationTarget: 1,
      });
    });

    expect(screen.getByText('Press the buzzer for Player 1 now...')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockElectronAPI.cancelCalibration).toHaveBeenCalledTimes(1);
  });
});
