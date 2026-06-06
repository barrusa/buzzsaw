// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Host -> Main
  openFloor: () => ipcRenderer.send('open-floor'),
  resetGame: () => ipcRenderer.send('reset-game'),
  startTimer: () => ipcRenderer.send('start-timer'),
  requestState: () => ipcRenderer.send('request-state'),
  
  // Player Management
  updatePlayerName: (id: number, name: string) => ipcRenderer.send('update-player-name', { id, name }),
  startCalibration: (id: number) => ipcRenderer.send('start-calibration', id),
  cancelCalibration: () => ipcRenderer.send('cancel-calibration'),
  openBoardWindow: () => ipcRenderer.send('open-board-window'),
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // Main -> Renderers
  onUpdateState: (callback: (state: GameStateData) => void) => {
    ipcRenderer.on('update-state', (_event, state) => callback(state));
  },
  
  // Simulation
  simulateBuzz: (playerId: number) => ipcRenderer.send('simulate-buzz', playerId),
});
