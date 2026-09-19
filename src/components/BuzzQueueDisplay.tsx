import React from 'react';
import './BuzzQueueDisplay.css';

interface BuzzQueueDisplayProps {
  buzzQueue: Buzz[];
  getPlayerName: (id: number) => string;
}

interface WinnerDisplayProps {
  winner: Buzz;
  getPlayerName: (id: number) => string;
}

const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner, getPlayerName }) => {
  return (
    <div className="winner-display-container">
      <div className="winner-display-content">
         <span>🚨</span>
         <span className="winner-display-name">{getPlayerName(winner.player)}</span>
         <span>🚨</span>
      </div>
    </div>
  );
};

interface QueueListProps {
  buzzQueue: Buzz[];
  getPlayerName: (id: number) => string;
  getMedal: (index: number) => string;
}

const QueueList: React.FC<QueueListProps> = ({ buzzQueue, getPlayerName, getMedal }) => {
  return (
    <div className="queue-list-container">
      {buzzQueue.slice(0, 3).map((b, i) => {
         const isBordered = i < 2 && i < buzzQueue.length - 1;
         const isFirst = i === 0;
         const classes = `queue-list-item ${isFirst ? 'queue-list-item-first' : ''} ${isBordered ? 'queue-list-item-bordered' : ''}`.trim();

         return (
           <div key={i} className={classes}>
             <div className="queue-list-item-player">
               <span className="queue-list-item-medal">{getMedal(i)}</span>
               <span>{getPlayerName(b.player)}</span>
             </div>
             <span className="queue-list-item-label">
               {b.label}
             </span>
           </div>
         );
      })}
    </div>
  );
};

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
        <WinnerDisplay winner={buzzQueue[0]} getPlayerName={getPlayerName} />
      )}
      <QueueList buzzQueue={buzzQueue} getPlayerName={getPlayerName} getMedal={getMedal} />
    </>
  );
};

export default BuzzQueueDisplay;
