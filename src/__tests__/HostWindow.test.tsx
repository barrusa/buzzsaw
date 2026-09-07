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

  describe('renders default state correctly', () => {
    beforeEach(() => {
      renderComponent();
    });

    it('renders Host Console text', () => {
      expect(screen.getByText('Host Console')).toBeTruthy();
    });

    it('renders IDLE text', () => {
      expect(screen.getByText('IDLE')).toBeTruthy();
    });

    it('renders 5s text', () => {
      expect(screen.getByText('5s')).toBeTruthy();
    });

    it('renders Waiting for buzz text', () => {
      expect(screen.getByText('Waiting for buzz...')).toBeTruthy();
    });

    it('renders None text', () => {
      expect(screen.getByText('None')).toBeTruthy();
    });
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

  describe('onUpdateState callback', () => {
    let updateCallback: any;

    beforeEach(async () => {
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
    });

    it('updates game state and timer correctly', () => {
      expect(screen.getByText('OPEN')).toBeTruthy();
      expect(screen.getByText('3s')).toBeTruthy();
    });

    it('renders buzz queue correctly', () => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('(0.000s)')).toBeTruthy();
    });

    it('renders locked out players correctly', () => {
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    it('renders player setup inputs correctly', () => {
      expect(screen.getByDisplayValue('Alice')).toBeTruthy();
      expect(screen.getByDisplayValue('Bob')).toBeTruthy();
    });
  });

  describe('player setup interactions', () => {
    let updateCallback: any;

    beforeEach(async () => {
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
    });

    it('calls updatePlayerName on input change', () => {
      const input = screen.getByDisplayValue('Alice');
      fireEvent.change(input, { target: { value: 'Alicia' } });
      expect(mockElectronAPI.updatePlayerName).toHaveBeenCalledWith(1, 'Alicia');
    });

    it('calls startCalibration when Map Buzzer is clicked', () => {
      fireEvent.click(screen.getByText('Map Buzzer'));
      expect(mockElectronAPI.startCalibration).toHaveBeenCalledWith(1);
    });

    it('calls cancelCalibration when Cancel is clicked', async () => {
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
});
