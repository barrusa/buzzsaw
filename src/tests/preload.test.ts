import { contextBridge, ipcRenderer } from 'electron';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    send: vi.fn(),
    on: vi.fn(),
  },
}));

import type { IpcRendererEvent } from 'electron';

describe('preload.ts', () => {
  let electronAPI: Record<string, (...args: unknown[]) => void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    await import('../preload');

    // Get the exposed API from the mock call
    const exposeCall = vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
    electronAPI = exposeCall[1];
  });

  it('exposes electronAPI in the main world', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );
  });

  it('sends open-floor event when openFloor is called', () => {
    electronAPI.openFloor();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-floor');
  });

  it('sends reset-game event when resetGame is called', () => {
    electronAPI.resetGame();
    expect(ipcRenderer.send).toHaveBeenCalledWith('reset-game');
  });

  it('sends request-state event when requestState is called', () => {
    electronAPI.requestState();
    expect(ipcRenderer.send).toHaveBeenCalledWith('request-state');
  });

  it('sends update-player-name event with data when updatePlayerName is called', () => {
    electronAPI.updatePlayerName(1, 'John');
    expect(ipcRenderer.send).toHaveBeenCalledWith('update-player-name', { id: 1, name: 'John' });
  });

  it('sends start-calibration event with id when startCalibration is called', () => {
    electronAPI.startCalibration(2);
    expect(ipcRenderer.send).toHaveBeenCalledWith('start-calibration', 2);
  });

  it('sends cancel-calibration event when cancelCalibration is called', () => {
    electronAPI.cancelCalibration();
    expect(ipcRenderer.send).toHaveBeenCalledWith('cancel-calibration');
  });

  it('sends open-board-window event when openBoardWindow is called', () => {
    electronAPI.openBoardWindow();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-board-window');
  });

  it('sends quit-app event when quitApp is called', () => {
    electronAPI.quitApp();
    expect(ipcRenderer.send).toHaveBeenCalledWith('quit-app');
  });

  it('sends simulate-buzz event with playerId when simulateBuzz is called', () => {
    electronAPI.simulateBuzz(3);
    expect(ipcRenderer.send).toHaveBeenCalledWith('simulate-buzz', 3);
  });

  it('registers update-state listener and calls callback with state when onUpdateState is called', () => {
    const callback = vi.fn();
    electronAPI.onUpdateState(callback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('update-state', expect.any(Function));

    const registeredCallback = vi.mocked(ipcRenderer.on).mock.calls[0][1];
    const mockState = { gameState: 'IDLE' };

    // Simulate ipc event
    registeredCallback({} as IpcRendererEvent, mockState);
    expect(callback).toHaveBeenCalledWith(mockState);
  });
});
