import React from 'react';

interface StateTextProps {
  gameState: 'IDLE' | 'OPEN' | 'LOCKED';
}

const getStateProps = (gameState: 'IDLE' | 'OPEN' | 'LOCKED') => {
  switch (gameState) {
    case 'OPEN':
      return { color: '#44ff44', text: 'OPEN' };
    case 'LOCKED':
      return { color: '#ff4444', text: 'LOCKED' };
    case 'IDLE':
    default:
      return { color: '#8888ff', text: 'READY' };
  }
};

const StateText: React.FC<StateTextProps> = ({ gameState }) => {
  const { color, text } = getStateProps(gameState);

  return (
    <div style={{
      fontSize: '1.5rem',
      marginBottom: 10,
      fontWeight: 'bold',
      letterSpacing: '0.1em',
      color,
      textShadow: '2px 2px 0px #000000',
      textAlign: 'center',
      width: '100%'
    }}>
      {text}
    </div>
  );
};

export default StateText;
