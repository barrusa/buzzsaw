import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

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
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { loadConfig } from './main';

describe('loadConfig', () => {
  const MOCK_DATA_PATH = path.join('/mocked/user/data/path', 'buzzsaw-config.json');
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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

  it('should return parsed config without modifying players if no players property exists', () => {
    const mockConfig = {
      hostBounds: { x: 0, y: 0, width: 800, height: 600 }
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(result).toEqual(mockConfig);
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
