// @vitest-environment jsdom
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BoardWindow } from '../App';

const mockElectronAPI = {
  requestState: vi.fn(),
  onUpdateState: vi.fn(),
};

describe('BoardWindow', () => {
  let updateStateCallback: (state: any) => void;

  beforeEach(() => {
    window.electronAPI = mockElectronAPI as any;

    mockElectronAPI.onUpdateState.mockImplementation((cb) => {
      updateStateCallback = cb;
    });

    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<BoardWindow />);

    // Default state: IDLE, timer 5
    expect(screen.getByText('READY')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('updates when game state changes to OPEN', () => {
    render(<BoardWindow />);

    act(() => {
      updateStateCallback({
        gameState: 'OPEN',
        buzzQueue: [],
        earlyBuzzers: [],
        timer: 5,
        players: [],
        calibrationTarget: null,
      });
    });

    expect(screen.getByText('OPEN')).toBeTruthy();
  });

  it('displays buzz queue and penalty correctly', () => {
    render(<BoardWindow />);

    act(() => {
      updateStateCallback({
        gameState: 'LOCKED',
        buzzQueue: [{ player: 1, label: 'Buzzer 1', time: 1000 }],
        earlyBuzzers: [2],
        timer: 0,
        players: [
          { id: 1, name: 'Alice', devicePath: null },
          { id: 2, name: 'Bob', devicePath: null }
        ],
        calibrationTarget: null,
      });
    });

    // Alice is in buzz queue (there are two elements because one is the big alert and one is the list item)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    // Bob is penalized
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    // State is LOCKED
    expect(screen.getAllByText('LOCKED').length).toBeGreaterThan(0);
  });
});
