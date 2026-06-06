import React from 'react';

interface TimerSectionProps {
  timer: number;
  gameState: 'IDLE' | 'OPEN' | 'LOCKED';
}

const TimerSection: React.FC<TimerSectionProps> = ({ timer, gameState }) => {
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
                backgroundColor: isActive
                  ? (gameState === 'OPEN' ? '#ffffff' : '#aaaaaa')
                  : 'rgba(0,0,0,0.3)',
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
        color: timer === 0 ? '#ff4444' : (gameState === 'OPEN' ? '#ffffff' : '#aaaaaa'),
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
