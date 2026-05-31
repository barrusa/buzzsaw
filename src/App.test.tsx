import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App, { useGameState } from './App';

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

describe('useGameState', () => {
  beforeEach(() => {
    // Reset the mock before each test
    window.electronAPI = { ...mockElectronAPI };
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current).toEqual({
      gameState: 'IDLE',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    });
  });

  it('should call window.electronAPI.requestState on mount', () => {
    renderHook(() => useGameState());

    expect(window.electronAPI.requestState).toHaveBeenCalled();
    expect(window.electronAPI.onUpdateState).toHaveBeenCalled();
  });

  it('should update state when onUpdateState callback is called', () => {
    let updateCallback: ((state: any) => void) | undefined;

    // Capture the callback passed to onUpdateState
    window.electronAPI.onUpdateState = vi.fn((cb) => {
      updateCallback = cb;
    });

    const { result } = renderHook(() => useGameState());

    const newState = {
      gameState: 'OPEN',
      buzzQueue: [{ player: 1, timestamp: 123, delta: 0, label: '+0ms' }],
      earlyBuzzers: [],
      timer: 4,
      players: [{ id: 1, name: 'Alice', devicePath: null }],
      calibrationTarget: null,
    };

    act(() => {
      if (updateCallback) {
        updateCallback(newState);
      }
    });

    expect(result.current).toEqual(newState);
  });
});

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
