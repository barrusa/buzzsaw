// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import StateText from './StateText';

describe('StateText Component', () => {
  it('renders "READY" with the correct color when gameState is "IDLE"', () => {
    render(<StateText gameState="IDLE" />);
    const element = screen.getByText('READY');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle('color: #8888ff');
  });

  it('renders "OPEN" with the correct color when gameState is "OPEN"', () => {
    render(<StateText gameState="OPEN" />);
    const element = screen.getByText('OPEN');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle('color: #44ff44');
  });

  it('renders "LOCKED" with the correct color when gameState is "LOCKED"', () => {
    render(<StateText gameState="LOCKED" />);
    const element = screen.getByText('LOCKED');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle('color: #ff4444');
  });
});
