import { renderHook, act } from '@testing-library/react';
import { useGameState } from './App';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useGameState', () => {
  beforeEach(() => {
    // Reset the mock before each test
    window.electronAPI = {
      onUpdateState: vi.fn(),
      requestState: vi.fn(),
      // Provide dummy implementations for other methods if needed
      openFloor: vi.fn(),
      resetGame: vi.fn(),
      startTimer: vi.fn(),
      simulateBuzz: vi.fn(),
      updatePlayerName: vi.fn(),
      startCalibration: vi.fn(),
      cancelCalibration: vi.fn(),
      openBoardWindow: vi.fn(),
      quitApp: vi.fn(),
    };
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

    expect(window.electronAPI.requestState).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.onUpdateState).toHaveBeenCalledTimes(1);
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