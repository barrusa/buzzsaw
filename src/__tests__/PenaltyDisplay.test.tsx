// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PenaltyDisplay from '../components/PenaltyDisplay';

describe('PenaltyDisplay', () => {
  const mockGetPlayerName = (id: number) => `Player ${id}`;

  it('renders nothing when there are no early buzzers', () => {
    const { container } = render(
      <PenaltyDisplay earlyBuzzers={[]} buzzQueue={[]} getPlayerName={mockGetPlayerName} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders early buzzers with their names and LOCKED text', () => {
    render(
      <PenaltyDisplay earlyBuzzers={[1, 2]} buzzQueue={[]} getPlayerName={mockGetPlayerName} />
    );

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    
    const lockedElements = screen.getAllByText('LOCKED');
    expect(lockedElements).toHaveLength(2);
  });

  it('does not render players who are in the buzz queue', () => {
    const buzzQueue = [
      { player: 2, timestamp: 123, delta: 0, label: 'test' }
    ];

    render(
      <PenaltyDisplay earlyBuzzers={[1, 2]} buzzQueue={buzzQueue} getPlayerName={mockGetPlayerName} />
    );

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.queryByText('Player 2')).not.toBeInTheDocument();

    const lockedElements = screen.getAllByText('LOCKED');
    expect(lockedElements).toHaveLength(1);
  });
});
