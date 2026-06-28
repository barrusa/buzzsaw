// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

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

describe('App', () => {
  beforeEach(() => {
    // Reset window.electronAPI
    window.electronAPI = mockElectronAPI;

    // Reset hash
    window.location.hash = '';

    // Mock HTMLMediaElement
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders HostWindow on the default route', () => {
    render(<App />);
    expect(screen.getByText('Host Console')).toBeTruthy();
  });

  it('renders BoardWindow on the /board route', () => {
    window.location.hash = '#/board';
    render(<App />);
    expect(screen.getByText('READY')).toBeTruthy();
  });
});

describe('Audio error tests', () => {
  beforeEach(() => {
    window.electronAPI = mockElectronAPI;
    window.location.hash = '#/board';
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('handles audio play error for buzz audio', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
    const error = new Error('Buzz play failed');
    window.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(error);

    render(<App />);

    const updateState = (window.electronAPI.onUpdateState as any).mock.calls[0][0];

    // Wrap in act as state updates happen
    await React.act(async () => {
      updateState({
        gameState: 'OPEN',
        buzzQueue: [{ player: 1, label: 'Buzzer 1' }],
        earlyBuzzers: [],
        timer: 5,
        players: [],
        calibrationTarget: null,
      });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Audio error", error);
    consoleErrorSpy.mockRestore();
  });

  it('handles audio play error for timeout audio', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
    const error = new Error('Timeout play failed');
    window.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(error);

    render(<App />);

    const updateState = (window.electronAPI.onUpdateState as any).mock.calls[0][0];

    // Explicitly set timer to > 0 first to ensure prevTimer is set
    await React.act(async () => {
      updateState({
        gameState: 'OPEN',
        buzzQueue: [],
        earlyBuzzers: [],
        timer: 5,
        players: [],
        calibrationTarget: null,
      });
    });

    // Then update to 0 to trigger the timeout
    await React.act(async () => {
      updateState({
        gameState: 'OPEN',
        buzzQueue: [],
        earlyBuzzers: [],
        timer: 0,
        players: [],
        calibrationTarget: null,
      });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Audio error", error);
    consoleErrorSpy.mockRestore();
  });
});
