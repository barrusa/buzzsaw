import React from 'react';

interface BuzzQueueDisplayProps {
  buzzQueue: Buzz[];
  getPlayerName: (id: number) => string;
}

const BuzzQueueDisplay: React.FC<BuzzQueueDisplayProps> = ({ buzzQueue, getPlayerName }) => {
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <>
      {buzzQueue.length > 0 && (
        <div style={{
          backgroundColor: '#0000cc',
          border: '4px solid #ffffff',
          padding: '15px 30px',
          marginBottom: 10,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          width: '100%',
          boxSizing: 'border-box',
          animation: 'winnerPulse 2s infinite ease-in-out'
        }}>
          <div style={{
            fontSize: '3.5rem',
            margin: '0',
            textShadow: '3px 3px 0px #000000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
             <span>🚨</span>
             <span style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{getPlayerName(buzzQueue[0].player)}</span>
             <span>🚨</span>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        border: '2px solid #ffffff',
        width: '100%',
        maxHeight: '300px', // Capping height to prevent long empty area
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {buzzQueue.slice(0, 3).map((b, i) => (
           <div key={i} style={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             padding: '10px 30px',
             borderBottom: i < 2 && i < buzzQueue.length - 1 ? '2px solid rgba(255,255,255,0.1)' : 'none',
             fontSize: '1.8rem',
             backgroundColor: i === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
             textShadow: '2px 2px 0px #000000',
             boxSizing: 'border-box'
           }}>
             <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
               <span style={{ fontSize: '2rem', width: 50, textAlign: 'center' }}>{getMedal(i)}</span>
               <span>{getPlayerName(b.player)}</span>
             </div>
             <span style={{ opacity: 0.9, fontFamily: "'Oswald', sans-serif" }}>
               {b.label}
             </span>
           </div>
        ))}
      </div>
    </>
  );
};

export default BuzzQueueDisplay;
