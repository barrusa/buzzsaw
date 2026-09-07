import React from 'react';

interface TimerSectionProps {
  timer: number;
  gameState: 'IDLE' | 'OPEN' | 'LOCKED';
}

const TimerSection: React.FC<TimerSectionProps> = ({ timer, gameState }) => {
  const getTimerColor = () => {
    if (timer === 0) return '#ff4444';
    if (gameState === 'OPEN') return '#ffffff';
    return '#aaaaaa';
  };

  const getSegmentColor = (isActive: boolean) => {
    if (!isActive) return 'rgba(0,0,0,0.3)';
    if (gameState === 'OPEN') return '#ffffff';
    return '#aaaaaa';
  };

  return (
    <div style={{
      marginTop: 0,
      backgroundColor: gameState === 'OPEN' ? '#00b300' : 'transparent',
      padding: '20px 0',
      borderRadius: 20,
      transition: 'all 0.2s ease-in-out',
      width: '100%',
      maxWidth: 900,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 30,
      boxSizing: 'border-box',
      minHeight: 160
    }}>
      {/* Segmented Countdown Bar */}
      <div style={{ display: 'flex', gap: 15 }}>
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = timer >= seg;
          return (
            <div
              key={seg}
              style={{
                width: 60,
                height: 100,
                backgroundColor: getSegmentColor(isActive),
                border: '4px solid #000',
                borderRadius: 4,
                boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.5), inset 0 0 10px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.1s ease-in-out'
              }}
            />
          );
        })}
      </div>

      {/* Numeric Timer */}
      <div style={{
        fontSize: '8rem',
        fontWeight: 'bold',
        lineHeight: 1,
        fontFamily: "'Oswald', sans-serif",
        color: getTimerColor(),
        textShadow: '4px 4px 0px #000000',
        minWidth: '100px',
        textAlign: 'left',
        marginTop: '-0.1em' // Minor visual tweak to center baseline/cap-height
      }}>
        {timer}
      </div>
    </div>
  );
};

export default TimerSection;
