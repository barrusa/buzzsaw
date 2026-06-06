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
