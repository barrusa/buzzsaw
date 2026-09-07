import React from 'react';

interface PlayerRowProps {
  player: Player;
  calibrationTarget: number | null;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, calibrationTarget }) => {
  return (
    <div className="player-row">
      <strong className="player-label">Player {player.id}:</strong>
      <input
        type="text"
        value={player.name}
        onChange={(e) => window.electronAPI.updatePlayerName(player.id, e.target.value)}
        placeholder="Enter Name"
        className="player-input"
      />
      <button
        onClick={() => window.electronAPI.startCalibration(player.id)}
        disabled={calibrationTarget !== null}
        className={`buzzer-btn ${player.devicePath ? 'buzzer-btn-mapped' : 'buzzer-btn-unmapped'}`}
      >
        {player.devicePath ? 'Mapped (Remap)' : 'Map Buzzer'}
      </button>
      <span className="device-status">
        {player.devicePath ? '✓ Ready' : '• No Device'}
      </span>
    </div>
  );
};

export default PlayerRow;
