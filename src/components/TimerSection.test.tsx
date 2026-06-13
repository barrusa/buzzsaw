// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TimerSection from './TimerSection';

describe('TimerSection', () => {
  it('renders the correct numeric timer value', () => {
    render(<TimerSection timer={5} gameState="IDLE" />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('has correct background color for the main container when OPEN', () => {
    const { container } = render(<TimerSection timer={5} gameState="OPEN" />);
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer.style.backgroundColor).toBe('rgb(0, 179, 0)'); // '#00b300' translates to rgb
  });

  it('has transparent background for the main container when not OPEN', () => {
    const { container } = render(<TimerSection timer={5} gameState="IDLE" />);
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer.style.backgroundColor).toBe('transparent');
  });

  it('applies correct text color when timer is 0', () => {
    render(<TimerSection timer={0} gameState="LOCKED" />);
    const timerElement = screen.getByText('0');
    expect(timerElement.style.color).toBe('rgb(255, 68, 68)'); // '#ff4444' translates to rgb
  });

  it('renders segmented countdown bar with correct active/inactive segments', () => {
    const { container } = render(<TimerSection timer={3} gameState="OPEN" />);
    
    // We expect 5 segment divs
    const segmentsContainer = container.firstChild?.firstChild as HTMLElement;
    expect(segmentsContainer.childNodes.length).toBe(5);
    
    const segments = Array.from(segmentsContainer.childNodes) as HTMLElement[];
    
    // Active segments (1, 2, 3)
    expect(segments[0].style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(segments[1].style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(segments[2].style.backgroundColor).toBe('rgb(255, 255, 255)');
    
    // Inactive segments (4, 5)
    expect(segments[3].style.backgroundColor).toBe('rgba(0, 0, 0, 0.3)');
    expect(segments[4].style.backgroundColor).toBe('rgba(0, 0, 0, 0.3)');
  });

  it('renders segmented countdown bar with correct color when IDLE', () => {
    const { container } = render(<TimerSection timer={3} gameState="IDLE" />);
    
    const segmentsContainer = container.firstChild?.firstChild as HTMLElement;
    const segments = Array.from(segmentsContainer.childNodes) as HTMLElement[];
    
    // Active segments (1, 2, 3) should have inactive text color when IDLE
    expect(segments[0].style.backgroundColor).toBe('rgb(170, 170, 170)'); // '#aaaaaa'
    
    // Inactive segments (4, 5)
    expect(segments[3].style.backgroundColor).toBe('rgba(0, 0, 0, 0.3)');
  });
});
