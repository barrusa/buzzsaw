/// <reference types="vite/client" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface ElectronAPI {
  openFloor: () => void;
  resetGame: () => void;
  startTimer: () => void; // Kept for API compatibility, though openFloor does it now
  requestState: () => void;
  onUpdateState: (callback: (state: GameStateData) => void) => void;
  simulateBuzz: (playerId: number) => void;
  
  // New API
  updatePlayerName: (id: number, name: string) => void;
  startCalibration: (id: number) => void;
  cancelCalibration: () => void;
  openBoardWindow: () => void;
  quitApp: () => void;
}

interface Window {
  electronAPI: ElectronAPI;
}

interface Buzz {
  player: number;
  timestamp: number;
  delta: number;
  label: string;
}

interface Player {
  id: number;
  name: string;
  devicePath: string | null;
}

interface GameStateData {
  gameState: 'IDLE' | 'OPEN' | 'LOCKED';
  buzzQueue: Buzz[];
  earlyBuzzers: number[];
  timer: number;
  players: Player[];
  calibrationTarget: number | null;
}
