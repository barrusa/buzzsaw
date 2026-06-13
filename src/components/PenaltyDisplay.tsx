import React, { useMemo } from 'react';

interface PenaltyDisplayProps {
  earlyBuzzers: number[];
  buzzQueue: Buzz[];
  getPlayerName: (id: number) => string;
}

const PenaltyDisplay: React.FC<PenaltyDisplayProps> = ({ earlyBuzzers, buzzQueue, getPlayerName }) => {
  const buzzedPlayerIds = useMemo(() => new Set(buzzQueue.map(b => b.player)), [buzzQueue]);

  return (
    <>
      {earlyBuzzers.map((pid) => {
        if (buzzedPlayerIds.has(pid)) {
          return null;
        }
        return (
          <div key={`penalty-${pid}`} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 30px',
            width: '100%',
            marginBottom: 5,
            fontSize: '1.8rem',
            backgroundColor: '#ff0000',
            border: '2px solid #ff4444',
            textShadow: '2px 2px 0px #000000',
            animation: 'shake 0.5s', // Optional visual flair
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', width: 50, textAlign: 'center' }}>⚠️</span>
              <span>{getPlayerName(pid)}</span>
            </div>
            <span style={{ opacity: 0.9, fontFamily: "'Oswald', sans-serif" }}>LOCKED</span>
          </div>
        );
      })}
    </>
  );
};

export default PenaltyDisplay;
