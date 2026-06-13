// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BuzzQueueDisplay from './BuzzQueueDisplay';

describe('BuzzQueueDisplay', () => {
  const mockGetPlayerName = vi.fn((id: number) => `Player ${id}`);

  it('renders nothing when the buzz queue is empty', () => {
    const { container } = render(
      <BuzzQueueDisplay buzzQueue={[]} getPlayerName={mockGetPlayerName} />
    );
    expect(container.textContent).toBe('');
  });

  it('renders a single winner correctly', () => {
    const queue = [
      { player: 1, timestamp: 1000, delta: 0, label: 'First' }
    ];
    render(<BuzzQueueDisplay buzzQueue={queue} getPlayerName={mockGetPlayerName} />);
    
    // Check winner pulse text
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0);
    expect(screen.getByText('🥇')).toBeTruthy();
    expect(screen.getByText('First')).toBeTruthy();
  });

  it('renders multiple players in the queue', () => {
    const queue = [
      { player: 1, timestamp: 1000, delta: 0, label: 'First' },
      { player: 2, timestamp: 1050, delta: 50, label: '+0.05s' },
      { player: 3, timestamp: 1100, delta: 100, label: '+0.10s' },
      { player: 4, timestamp: 1150, delta: 150, label: '+0.15s' }
    ];
    render(<BuzzQueueDisplay buzzQueue={queue} getPlayerName={mockGetPlayerName} />);
    
    // Winner
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0);
    expect(screen.getByText('🥇')).toBeTruthy();

    // Runners up
    expect(screen.getByText('Player 2')).toBeTruthy();
    expect(screen.getByText('🥈')).toBeTruthy();
    expect(screen.getByText('+0.05s')).toBeTruthy();

    expect(screen.getByText('Player 3')).toBeTruthy();
    expect(screen.getByText('🥉')).toBeTruthy();
    expect(screen.getByText('+0.10s')).toBeTruthy();

    // Fourth player should not be rendered as it slices to 3
    expect(screen.queryByText('Player 4')).toBeNull();
  });
});
