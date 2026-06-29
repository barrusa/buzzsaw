import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn().mockReturnValue('/mock/path'),
      on: vi.fn(),
      quit: vi.fn()
    },
    BrowserWindow: vi.fn(),
    ipcMain: { on: vi.fn() },
    globalShortcut: { register: vi.fn() }
  };
});

// Mock fs to avoid errors when loading/saving config
vi.mock('fs', () => {
  return {
    default: {
      existsSync: vi.fn().mockReturnValue(false),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      promises: {
        readFile: vi.fn()
      }
    }
  };
});

// Mock node-hid
vi.mock('node-hid', () => {
  return {
    default: {
      devices: vi.fn().mockReturnValue([]),
      HID: vi.fn()
    }
  };
});

import {
  handleBuzz,
  openFloor,
  resetGame,
  buzzQueue,
  earlyBuzzers,
  gameState,
  floorOpenTime,
  __setGameStateForTest,
  __setBuzzQueueForTest,
  __setEarlyBuzzersForTest,
  __setFloorOpenTimeForTest,
  __getEarlyBuzzersForTest,
  __getBuzzQueueForTest,
  __getTimerValueForTest,
  __getTimerIntervalForTest,
  __setTimerIntervalForTest,
  __getGameStateForTest,
  __forceQuitForTest,
  loadConfig
} from '../main.ts';

import fs from 'fs';

describe('Test Utilities', () => {
  it('should set and get gameState', () => {
    __setGameStateForTest('LOCKED');
    expect(gameState).toBe('LOCKED');
    __setGameStateForTest('OPEN');
    expect(gameState).toBe('OPEN');
  });

  it('should set and get buzzQueue', () => {
    const mockQueue = [
      { player: 1, timestamp: 100, delta: 0, label: '' },
      { player: 2, timestamp: 200, delta: 100, label: '+100 MS' }
    ];
    __setBuzzQueueForTest(mockQueue);
    expect(buzzQueue).toEqual(mockQueue);
    expect(__getBuzzQueueForTest()).toEqual(mockQueue);
  });

  it('should set and get earlyBuzzers', () => {
    const mockSet = new Set([1, 2, 3]);
    __setEarlyBuzzersForTest(mockSet);
    expect(earlyBuzzers).toEqual(mockSet);
    expect(__getEarlyBuzzersForTest()).toEqual(mockSet);
  });

  it('should set and get floorOpenTime', () => {
    __setFloorOpenTimeForTest(12345);
    expect(floorOpenTime).toBe(12345);
  });
});

describe('openFloor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    __setGameStateForTest('IDLE');
    __setBuzzQueueForTest([{ player: 1, timestamp: 900, delta: 0, label: '' }]);
    __setEarlyBuzzersForTest(new Set([1, 2]));
    __setTimerIntervalForTest(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sets initial state correctly', () => {
    openFloor();
    expect(__getGameStateForTest()).toBe('OPEN');
    expect(buzzQueue.length).toBe(0);
    // floorOpenTime is not easily accessible but performance.now mock asserts it
    expect(__getTimerValueForTest()).toBe(5);
    expect(__getTimerIntervalForTest()).not.toBeNull();
  });

  it('clears early buzzers after penalty time', () => {
    openFloor();
    expect(earlyBuzzers.size).toBe(2);
    vi.advanceTimersByTime(250);
    expect(earlyBuzzers.size).toBe(0);
  });

  it('clears existing timerInterval', () => {
    const mockInterval = setInterval(() => {}, 10000);
    __setTimerIntervalForTest(mockInterval);

    // In node, a timer object isn't strictly identical if cleared, but
    // openFloor sets a new interval
    openFloor();
    const newInterval = __getTimerIntervalForTest();
    expect(newInterval).not.toBe(mockInterval);
    // clean up
    clearInterval(mockInterval);
  });

  it('ticks down timer and locks game', () => {
    openFloor();
    expect(__getTimerValueForTest()).toBe(5);
    expect(__getGameStateForTest()).toBe('OPEN');

    vi.advanceTimersByTime(1000);
    expect(__getTimerValueForTest()).toBe(4);

    vi.advanceTimersByTime(4000);
    expect(__getTimerValueForTest()).toBe(0);
    expect(__getGameStateForTest()).toBe('LOCKED');
    expect(__getTimerIntervalForTest()).toBeNull();
  });
});

describe('handleBuzz', () => {
  beforeEach(() => {
    // Reset state before each test
    __setGameStateForTest('IDLE');
    __setBuzzQueueForTest([]);
    __setEarlyBuzzersForTest(new Set());
    __setFloorOpenTimeForTest(0);

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when gameState is IDLE', () => {
    it('should add player to earlyBuzzers if not already present', () => {
      handleBuzz(1);

      expect(earlyBuzzers.has(1)).toBe(true);
    });

    it('should not do anything if player is already in earlyBuzzers', () => {
      __setEarlyBuzzersForTest(new Set([1]));

      // Store size before
      const sizeBefore = earlyBuzzers.size;

      handleBuzz(1);

      // Should still be just player 1
      expect(earlyBuzzers.size).toBe(sizeBefore);
      expect(earlyBuzzers.has(1)).toBe(true);
    });
  });

  describe('when gameState is OPEN', () => {
    beforeEach(() => {
      __setGameStateForTest('OPEN');
      __setFloorOpenTimeForTest(800); // 1000 - 800 = 200 (within 250ms penalty window)
    });

    it('should ignore buzz if player is in earlyBuzzers and within penalty window', () => {
      __setEarlyBuzzersForTest(new Set([1]));
      // penalty unlock time = floorOpenTime (800) + 250 = 1050
      // now = 1000

      handleBuzz(1);

      expect(buzzQueue.length).toBe(0);
    });

    it('should process buzz if player is in earlyBuzzers but penalty window has passed', () => {
      __setEarlyBuzzersForTest(new Set([1]));
      __setFloorOpenTimeForTest(700); // penalty unlock time = 700 + 250 = 950. now = 1000.

      handleBuzz(1);

      expect(buzzQueue.length).toBe(1);
      expect(buzzQueue[0].player).toBe(1);
    });

    it('should not add to buzzQueue if player already in buzzQueue', () => {
      __setBuzzQueueForTest([{
        player: 1,
        timestamp: 900,
        delta: 0,
        label: ''
      }]);

      handleBuzz(1);

      expect(buzzQueue.length).toBe(1); // Still 1
    });

    it('should add first player to buzzQueue with delta 0 and empty label', () => {
      handleBuzz(1);

      expect(buzzQueue.length).toBe(1);
      expect(buzzQueue[0]).toEqual({
        player: 1,
        timestamp: 1000,
        delta: 0,
        label: ''
      });
    });

    it('should add subsequent players to buzzQueue with calculated delta and label', () => {
      __setBuzzQueueForTest([{
        player: 2,
        timestamp: 900,
        delta: 0,
        label: ''
      }]);

      handleBuzz(1);

      expect(buzzQueue.length).toBe(2);
      expect(buzzQueue[1]).toEqual({
        player: 1,
        timestamp: 1000,
        delta: 100, // 1000 - 900
        label: '+100 MS'
      });
    });
  });

  describe('when gameState is LOCKED', () => {
    it('should not modify any state', () => {
      __setGameStateForTest('LOCKED');

      handleBuzz(1);

      expect(earlyBuzzers.size).toBe(0);
      expect(buzzQueue.length).toBe(0);
    });
  });
});

describe('forceQuit', () => {
  let processKillSpy: any;

  beforeEach(() => {
    processKillSpy = vi.spyOn(process, 'kill').mockImplementation(() => { /* noop to prevent exiting tests */ });
  });

  afterEach(() => {
    processKillSpy.mockRestore();
  });

  it('should save config synchronously and kill the process', async () => {
    // We get the fs mock we created at the top of the file
    const fs = await import('fs');

    __forceQuitForTest();

    expect(fs.default.writeFileSync).toHaveBeenCalled();
    expect(processKillSpy).toHaveBeenCalledWith(process.pid, 'SIGKILL');
  });
});

describe('resetGame', () => {
  it('resets all game state to initial values', () => {
    // Set non-default state
    __setGameStateForTest('OPEN');
    __setBuzzQueueForTest([{ player: 1, timestamp: 900, delta: 0, label: '' }]);
    __setEarlyBuzzersForTest(new Set([1]));
    const mockInterval = setInterval(() => {}, 1000);
    __setTimerIntervalForTest(mockInterval);

    // Call resetGame
    resetGame();

    // Verify reset
    expect(__getGameStateForTest()).toBe('IDLE');
    expect(__getBuzzQueueForTest()).toEqual([]);
    expect(__getEarlyBuzzersForTest().size).toBe(0);
    expect(__getTimerValueForTest()).toBe(5);
    expect(__getTimerIntervalForTest()).toBeNull();

    // clean up
    clearInterval(mockInterval);
  });
});

describe('loadConfig', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return null when the config file does not exist (ENOENT)', async () => {
    const error: any = new Error('ENOENT: no such file or directory');
    error.code = 'ENOENT';
    vi.mocked(fs.promises.readFile).mockRejectedValueOnce(error);

    const result = await loadConfig();
    expect(result).toBeNull();
  });

  it('should return parsed config when file exists and contains valid JSON', async () => {
    const mockConfig = {
      players: [
        { id: 1, name: "Test Player", devicePath: "test-path" }
      ],
      hostBounds: { x: 0, y: 0, width: 800, height: 600 }
    };

    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(JSON.stringify(mockConfig));

    const result = await loadConfig();
    expect(result).toEqual(mockConfig);
  });

  it('should return null if the config is invalid', async () => {
    const mockConfig = {
      hostBounds: { x: 0, y: 0, width: 800, height: 600 }
    };

    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(JSON.stringify(mockConfig));

    const result = await loadConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load config: Invalid configuration format');
    expect(result).toBeNull();
  });

  it('should catch errors, log them, and return null on invalid JSON', async () => {
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce('invalid-json');

    const result = await loadConfig();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Failed to load config:');
    expect(result).toBeNull();
  });

  it('should catch unhandled read errors', async () => {
    const error: any = new Error('Read failed');
    vi.mocked(fs.promises.readFile).mockRejectedValueOnce(error);

    const result = await loadConfig();
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load config:', error);
  });
});
