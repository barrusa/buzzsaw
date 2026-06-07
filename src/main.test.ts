import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  loadConfig,
  saveConfig,
  handleBuzz,
  __setGameStateForTest,
  __getEarlyBuzzersForTest,
  __setFloorOpenTimeForTest,
  __getBuzzQueueForTest,
  __setBuzzQueueForTest
} from './main';

// Mocks setup
vi.mock('node-hid', () => ({
  default: {
    HID: vi.fn(),
    devices: vi.fn(() => []),
  }
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mocked/user/data/path'),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    on: vi.fn(),
  },
  globalShortcut: {
    register: vi.fn(),
  }
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined)
    }
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('saveConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should catch and log errors thrown by fs.promises.writeFile', async () => {
    const error = new Error('Disk full');
    (fs.promises.writeFile as any).mockRejectedValueOnce(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation to prevent actual console.error output during testing
    });

    await saveConfig();

    expect(fs.promises.writeFile).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save config:', error);
    consoleErrorSpy.mockRestore();
  });
});
describe('loadConfig', () => {
  const MOCK_DATA_PATH = path.join('/mocked/user/data/path', 'buzzsaw-config.json');
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return null when the config file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadConfig();

    expect(fs.existsSync).toHaveBeenCalledWith(MOCK_DATA_PATH);
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return parsed config when file exists and contains valid JSON', () => {
    const mockConfig = {
      players: [
        { id: 1, name: "Test Player", devicePath: "test-path" }
      ],
      hostBounds: { x: 0, y: 0, width: 800, height: 600 }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(fs.existsSync).toHaveBeenCalledWith(MOCK_DATA_PATH);
    expect(fs.readFileSync).toHaveBeenCalledWith(MOCK_DATA_PATH, 'utf-8');
    expect(result).toEqual(mockConfig);
  });

  it('should return null if the config lacks a players array', () => {
    const mockConfig = {
      hostBounds: { x: 0, y: 0, width: 800, height: 600 }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load config: Invalid configuration format');
    expect(result).toBeNull();
  });

  it('should return null if a player has an invalid id type', () => {
    const mockConfig = {
      players: [
        { id: "1", name: "Test Player", devicePath: "test-path" } // id should be a number
      ]
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load config: Invalid configuration format');
    expect(result).toBeNull();
  });

  it('should catch errors, log them, and return null on invalid JSON', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('invalid-json');

    const result = loadConfig();

    expect(fs.readFileSync).toHaveBeenCalledWith(MOCK_DATA_PATH, 'utf-8');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Failed to load config:');
    expect(result).toBeNull();
  });
});

describe('handleBuzz', () => {
  let performanceNowSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    __getEarlyBuzzersForTest().clear();
    __setBuzzQueueForTest([]);
    __setFloorOpenTimeForTest(0);
    __setGameStateForTest('IDLE');
    performanceNowSpy = vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  it('should add player to earlyBuzzers and trigger broadcast if buzzing in IDLE state', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    __setGameStateForTest('IDLE');

    handleBuzz(1);

    expect(__getEarlyBuzzersForTest().has(1)).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith('Player 1 buzzed early!');
    // Ideally we would verify broadcastState was called, but since it's an internal function and
    // not easily mockable without refactoring, we verify state changes.

    consoleLogSpy.mockRestore();
  });

  it('should not add to earlyBuzzers again if player already buzzed early in IDLE state', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    __setGameStateForTest('IDLE');
    __getEarlyBuzzersForTest().add(1);

    handleBuzz(1);

    expect(__getEarlyBuzzersForTest().size).toBe(1);
    expect(consoleLogSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it('should ignore buzz if player is in earlyBuzzers and buzzing within penalty period during OPEN state', () => {
    __setGameStateForTest('OPEN');
    __getEarlyBuzzersForTest().add(1);
    __setFloorOpenTimeForTest(1000);
    performanceNowSpy.mockReturnValue(1100); // 100ms after floor open (within 250ms penalty)

    handleBuzz(1);

    expect(__getBuzzQueueForTest()).toHaveLength(0);
  });

  it('should register buzz if player is in earlyBuzzers and buzzing after penalty period during OPEN state', () => {
    __setGameStateForTest('OPEN');
    __getEarlyBuzzersForTest().add(1);
    __setFloorOpenTimeForTest(1000);
    performanceNowSpy.mockReturnValue(1300); // 300ms after floor open (after 250ms penalty)

    handleBuzz(1);

    const queue = __getBuzzQueueForTest();
    expect(queue).toHaveLength(1);
    expect(queue[0].player).toBe(1);
    expect(queue[0].timestamp).toBe(1300);
    expect(queue[0].delta).toBe(0);
    expect(queue[0].label).toBe('');
  });

  it('should register normal buzz if player is not in earlyBuzzers during OPEN state', () => {
    __setGameStateForTest('OPEN');
    performanceNowSpy.mockReturnValue(1050);

    handleBuzz(2);

    const queue = __getBuzzQueueForTest();
    expect(queue).toHaveLength(1);
    expect(queue[0].player).toBe(2);
    expect(queue[0].timestamp).toBe(1050);
  });
});
