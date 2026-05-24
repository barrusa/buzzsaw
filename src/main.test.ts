import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { saveConfig } from './main';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    on: vi.fn(),
  },
  globalShortcut: {
    register: vi.fn(),
  },
}));

vi.mock('node-hid', () => ({
  default: {
    devices: vi.fn(() => []),
    HID: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  default: {
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe('saveConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should catch and log errors thrown by fs.writeFileSync', () => {
    const error = new Error('Disk full');
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw error;
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation to prevent actual console.error output during testing
    });

    saveConfig();

    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save config:', error);
  });
});
