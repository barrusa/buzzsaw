import { renderHook } from '@testing-library/react';
import { useAudio } from '../App';

describe('useAudio', () => {
  let playMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    playMock = vi.fn().mockResolvedValue(undefined);

    // Override global HTMLAudioElement prototype since App.tsx creates `new Audio(...)` at module scope
    window.HTMLMediaElement.prototype.play = playMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should play buzz sound when a new buzz occurs', () => {
    const initialState = {
      gameState: 'OPEN',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    } as any;

    const { rerender } = renderHook(({ state }) => useAudio(state), {
      initialProps: { state: initialState }
    });

    expect(playMock).not.toHaveBeenCalled();

    // Rerender with a new buzz
    rerender({
      state: {
        ...initialState,
        buzzQueue: [{ player: 1, timestamp: 123, delta: 0, label: 'test' }],
      }
    });

    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it('should play timeout sound when timer reaches 0 and no one buzzed', () => {
    const initialState = {
      gameState: 'OPEN',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    } as any;

    const { rerender } = renderHook(({ state }) => useAudio(state), {
      initialProps: { state: initialState }
    });

    expect(playMock).not.toHaveBeenCalled();

    // Rerender with timer reaching 0
    rerender({
      state: {
        ...initialState,
        timer: 0,
      }
    });

    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it('should not play timeout sound if timer is 0 but someone buzzed', () => {
    const initialState = {
      gameState: 'OPEN',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    } as any;

    const { rerender } = renderHook(({ state }) => useAudio(state), {
      initialProps: { state: initialState }
    });

    expect(playMock).not.toHaveBeenCalled();

    // Rerender with timer reaching 0 AND someone buzzed
    rerender({
      state: {
        ...initialState,
        timer: 0,
        buzzQueue: [{ player: 1, timestamp: 123, delta: 0, label: 'test' }],
      }
    });

    // It should have played the buzz sound, but not the timeout sound.
    // So playMock should be called exactly 1 time (for buzz), not 2.
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it('should handle errors thrown by audio play gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    playMock.mockRejectedValueOnce(new Error('Audio playback failed'));

    const initialState = {
      gameState: 'OPEN',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    } as any;

    const { rerender } = renderHook(({ state }) => useAudio(state), {
      initialProps: { state: initialState }
    });

    rerender({
      state: {
        ...initialState,
        buzzQueue: [{ player: 1, timestamp: 123, delta: 0, label: 'test' }],
      }
    });

    // We have to wait for the promise rejection to be caught
    return Promise.resolve().then(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith('Audio error', expect.any(Error));
        consoleErrorMock.mockRestore();
    });
  });

  it('should handle errors thrown by timeout audio play gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    playMock.mockRejectedValueOnce(new Error('Audio playback failed'));

    const initialState = {
      gameState: 'OPEN',
      buzzQueue: [],
      earlyBuzzers: [],
      timer: 5,
      players: [],
      calibrationTarget: null,
    } as any;

    const { rerender } = renderHook(({ state }) => useAudio(state), {
      initialProps: { state: initialState }
    });

    rerender({
      state: {
        ...initialState,
        timer: 0,
      }
    });

    // We have to wait for the promise rejection to be caught
    return Promise.resolve().then(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith('Audio error', expect.any(Error));
        consoleErrorMock.mockRestore();
    });
  });
});
