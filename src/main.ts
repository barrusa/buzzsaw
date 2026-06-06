import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import HID from 'node-hid';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// (Disabled to fix bundling issues on macOS)
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// --- Persistence ---
const DATA_PATH = path.join(app.getPath('userData'), 'buzzsaw-config.json');

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player {
  id: number;
  name: string;
  devicePath: string | null;
}

interface ConfigData {
  players: Player[];
  hostBounds?: WindowBounds;
  boardBounds?: WindowBounds;
}

let players: Player[] = [
  { id: 1, name: "Player 1", devicePath: null },
  { id: 2, name: "Player 2", devicePath: null },
  { id: 3, name: "Player 3", devicePath: null },
];

const loadConfig = (): ConfigData | null => {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      if (data.players) {
        players = data.players;
      }
      return data;
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return null;
};

const saveConfig = () => {
  try {
    const config: ConfigData = {
      players,
      hostBounds: mainWindow?.getBounds(),
      boardBounds: boardWindow?.getBounds(),
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(config, null, 2));
    console.log('Saved config to', DATA_PATH);
  } catch (e) {
    console.error('Failed to save config:', e);
  }
};

// --- Game State & Logic ---

type GameState = 'IDLE' | 'OPEN' | 'LOCKED';

interface Buzz {
  player: number;
  timestamp: number;
  delta: number;
  label: string;
}

let gameState: GameState = 'IDLE';
let buzzQueue: Buzz[] = [];
const earlyBuzzers: Set<number> = new Set();
let floorOpenTime = 0;
let timerValue = 5;
let timerInterval: NodeJS.Timeout | null = null;
let calibrationTarget: number | null = null;

// Devices
const VENDOR_ID = 0x0fc5;
const PRODUCT_ID = 0xb080;
const hidDevices: HID.HID[] = [];

let mainWindow: BrowserWindow | null = null;
let boardWindow: BrowserWindow | null = null;

// --- Window Management ---

const createMainWindow = (bounds?: WindowBounds) => {
  mainWindow = new BrowserWindow({
    width: bounds?.width || 900,
    height: bounds?.height || 700,
    x: bounds?.x,
    y: bounds?.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('close', () => {
    saveConfig();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    forceQuit();
  });
};

const createBoardWindow = (bounds?: WindowBounds) => {
  if (boardWindow) {
    boardWindow.focus();
    return;
  }

  boardWindow = new BrowserWindow({
    width: bounds?.width || 800,
    height: bounds?.height || 600,
    x: bounds?.x,
    y: bounds?.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const url = MAIN_WINDOW_VITE_DEV_SERVER_URL 
    ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/board`
    : `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}#/board`;
    
  boardWindow.loadURL(url);

  boardWindow.on('close', () => {
     saveConfig();
  });

  boardWindow.on('closed', () => {
    boardWindow = null;
  });
};

// --- State Updates ---

const broadcastState = () => {
  const state = {
    gameState,
    buzzQueue,
    earlyBuzzers: Array.from(earlyBuzzers),
    timer: timerValue,
    players,
    calibrationTarget
  };
  
  if (mainWindow) mainWindow.webContents.send('update-state', state);
  if (boardWindow) boardWindow.webContents.send('update-state', state);
};

// --- Game Logic ---

const handleBuzz = (playerId: number) => {
  const now = performance.now();

  if (gameState === 'IDLE') {
    if (!earlyBuzzers.has(playerId)) {
      console.log(`Player ${playerId} buzzed early!`);
      earlyBuzzers.add(playerId);
      broadcastState();
    }
    return;
  }

  if (gameState === 'OPEN') {
    // Check penalty
    if (earlyBuzzers.has(playerId)) {
      const unlockTime = floorOpenTime + 250;
      if (now < unlockTime) {
        return; // Ignore buzz
      }
    }

    if (buzzQueue.find(b => b.player === playerId)) return;

    const isFirst = buzzQueue.length === 0;
    const delta = isFirst ? 0 : now - buzzQueue[0].timestamp;
    
    buzzQueue.push({
      player: playerId,
      timestamp: now,
      delta: delta,
      label: isFirst ? '' : `+${Math.round(delta)} MS`
    });
    
    broadcastState();
  }
};

const handleDeviceInput = (devicePath: string) => {
  if (calibrationTarget !== null) {
    const player = players.find(p => p.id === calibrationTarget);
    if (player) {
      players.forEach(p => { if (p.devicePath === devicePath) p.devicePath = null; });
      player.devicePath = devicePath;
      console.log(`Mapped device ${devicePath} to Player ${player.id}`);
      saveConfig();
    }
    calibrationTarget = null;
    broadcastState();
    return;
  }

  const player = players.find(p => p.devicePath === devicePath);
  if (player) {
    handleBuzz(player.id);
  }
};

// --- Helper: Force Quit ---
const forceQuit = () => {
  saveConfig();
  // Nuclear option: Kill the process to prevent node-hid hangs
  process.kill(process.pid, 'SIGKILL');
};

// --- IPC Handlers ---

ipcMain.on('open-floor', () => {
  gameState = 'OPEN';
  buzzQueue = [];
  floorOpenTime = performance.now();
  
  // Clear early buzzers after penalty time (250ms)
  setTimeout(() => {
    earlyBuzzers.clear();
    broadcastState();
  }, 250);
  
  timerValue = 5;
  if (timerInterval) clearInterval(timerInterval);
  
  broadcastState(); 
  
  timerInterval = setInterval(() => {
    timerValue -= 1;
    if (timerValue <= 0) {
      timerValue = 0;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      gameState = 'LOCKED';
    }
    broadcastState();
  }, 1000);
});

ipcMain.on('reset-game', () => {
  gameState = 'IDLE';
  buzzQueue = [];
  earlyBuzzers.clear();
  timerValue = 5;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  broadcastState();
});

ipcMain.on('update-player-name', (event, { id, name }) => {
  const p = players.find(player => player.id === id);
  if (p) {
    p.name = name;
    saveConfig();
    broadcastState();
  }
});

ipcMain.on('start-calibration', (event, playerId) => {
  calibrationTarget = playerId;
  broadcastState();
});

ipcMain.on('cancel-calibration', () => {
  calibrationTarget = null;
  broadcastState();
});

ipcMain.on('simulate-buzz', (event, playerId) => {
  handleBuzz(playerId);
});

ipcMain.on('open-board-window', () => {
  createBoardWindow();
});

ipcMain.on('request-state', () => {
  broadcastState();
});

ipcMain.on('start-timer', () => {
  // Placeholder for future timer start logic if needed
});

ipcMain.on('quit-app', () => {
  forceQuit();
});

// --- HID Setup (Event Mode - Restored) ---

const initHID = () => {
  setTimeout(() => {
    try {
      const devices = HID.devices();
      const delcoms = devices.filter(d => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID);
      
      const uniquePaths = new Set<string>();
      const uniqueDelcoms = delcoms.filter(d => {
          if (!d.path) return false;
          if (uniquePaths.has(d.path)) return false;
          uniquePaths.add(d.path);
          return true;
      });
  
      console.log(`Found ${uniqueDelcoms.length} unique Delcom devices.`);
      
      uniqueDelcoms.forEach((d) => {
        if (!d.path) return;
        try {
          const device = new HID.HID(d.path);
          hidDevices.push(device);
          
          let lastState = false;

          device.on('data', (data) => {
             if (calibrationTarget !== null) {
               console.log(`[HID ${d.path}] Data:`, data.toString('hex'));
             }
             // Byte 3 check (from previous success)
             const pressed = data.length > 3 && data[3] > 0;
             if (pressed && !lastState && d.path) {
               handleDeviceInput(d.path);
             }
             lastState = pressed;
          });
          
          device.on('error', (err) => console.error('HID Error:', err));
        } catch (e) {
          console.error(`Failed to open device at ${d.path}`, e);
        }
      });
      
    } catch (e) {
      console.error("HID Initialization failed:", e);
    }
  }, 1000);
};

// --- App Lifecycle ---

app.on('ready', () => {
  const config = loadConfig();
  createMainWindow(config?.hostBounds);
  createBoardWindow(config?.boardBounds);
  initHID();

  globalShortcut.register('CommandOrControl+Shift+O', () => {
    gameState = 'OPEN';
    buzzQueue = [];
    floorOpenTime = performance.now();
    
    // Clear early buzzers after penalty time
    setTimeout(() => {
      earlyBuzzers.clear();
      broadcastState();
    }, 250);

    timerValue = 5;
    if (timerInterval) clearInterval(timerInterval);
    broadcastState(); 
    timerInterval = setInterval(() => {
      timerValue -= 1;
      if (timerValue <= 0) {
        timerValue = 0;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        gameState = 'LOCKED';
      }
      broadcastState();
    }, 1000);
  });

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    gameState = 'IDLE';
    buzzQueue = [];
    earlyBuzzers.clear();
    timerValue = 5;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    broadcastState();
  });
});

app.on('window-all-closed', () => {
  forceQuit();
});
