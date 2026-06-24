// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockRender = vi.fn();
  return {
    createRoot: vi.fn().mockReturnValue({
      render: mockRender,
      unmount: vi.fn(),
    }),
    mockRender,
    App: () => 'MockedApp',
  };
});

// Mock dependencies
vi.mock('./index.css', () => ({}));
vi.mock('./App', () => ({ default: mocks.App }));
vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
}));

import { createRoot } from 'react-dom/client';
import App from './App';

describe('renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should render App when root element exists', async () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);

    await import('./renderer');

    expect(createRoot).toHaveBeenCalledWith(rootDiv);
    expect(mocks.mockRender).toHaveBeenCalledWith(React.createElement(App));
  });

  it('should log an error when root element does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML = ''; // Ensure root does not exist

    vi.resetModules(); // Reset modules to re-import renderer without query string
    await import('./renderer');

    expect(createRoot).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to find the root element');

    consoleSpy.mockRestore();
  });
});
