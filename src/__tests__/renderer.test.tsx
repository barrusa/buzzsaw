// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';

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
vi.mock('../index.css', () => ({}));
vi.mock('../App', () => ({ default: mocks.App }));
vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
}));

describe('renderer', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('should render App when root element exists', async () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);

    await import('../renderer');

    expect(mocks.createRoot).toHaveBeenCalledWith(rootDiv);
    expect(mocks.mockRender).toHaveBeenCalledWith(React.createElement(App));
  });

  it('should log an error when root element does not exist', async () => {
    document.body.innerHTML = ''; // Ensure root does not exist

    await import('../renderer');

    expect(mocks.createRoot).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to find the root element');
  });
});
