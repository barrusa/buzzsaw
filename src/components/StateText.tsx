import React from 'react';

interface StateTextProps {
  gameState: 'IDLE' | 'OPEN' | 'LOCKED';
}

const StateText: React.FC<StateTextProps> = ({ gameState }) => {
  return (
    <div style={{
      fontSize: '1.5rem',
      marginBottom: 10,
      fontWeight: 'bold',
      letterSpacing: '0.1em',
      color: gameState === 'OPEN' ? '#44ff44' : (gameState === 'LOCKED' ? '#ff4444' : '#8888ff'),
      textShadow: '2px 2px 0px #000000',
      textAlign: 'center',
      width: '100%'
    }}>
      {gameState === 'IDLE' ? 'READY' : gameState}
    </div>
  );
};

export default StateText;
