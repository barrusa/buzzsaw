import React, { useEffect, useState, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import TimerSection from './components/TimerSection';
import StateText from './components/StateText';
import PenaltyDisplay from './components/PenaltyDisplay';
import BuzzQueueDisplay from './components/BuzzQueueDisplay';

const useGameState = () => {
  const [state, setState] = useState<GameStateData>({
    gameState: 'IDLE',
    buzzQueue: [],
    earlyBuzzers: [],
    timer: 5,
    players: [],
    calibrationTarget: null,
  });

  useEffect(() => {
    window.electronAPI.onUpdateState((newState) => {
      setState(newState);
    });
    // Request initial state
    window.electronAPI.requestState();
  }, []);

  return state;
};

// --- Audio Logic ---
const buzzAudio = new Audio('sounds/buzz.wav');
const timeoutAudio = new Audio('sounds/timeout.mp3');

export const useAudio = (state: GameStateData) => {
  const prevQueueLen = useRef(0);
  const prevTimer = useRef(5);

  useEffect(() => {
    // Buzz Sound: Play on every new buzz
    if (state.buzzQueue.length > prevQueueLen.current) {
       buzzAudio.currentTime = 0;
       buzzAudio.play().catch(e => console.error("Audio error", e));
    }
    prevQueueLen.current = state.buzzQueue.length;

    // Timeout Sound: Only play if no one buzzed in
    if (prevTimer.current > 0 && state.timer === 0 && state.buzzQueue.length === 0) {
       timeoutAudio.currentTime = 0;
       timeoutAudio.play().catch(e => console.error("Audio error", e));
    }
    prevTimer.current = state.timer;

  }, [state.buzzQueue.length, state.timer]);
};

// --- Components ---

const PlayerSetup = ({ players, calibrationTarget }: { players: Player[], calibrationTarget: number | null }) => {
  return (
    <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
      <h3>Player Setup & Buzzer Mapping</h3>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        Click "Map Buzzer" then press the physical button to assign it.
      </p>
      
      {calibrationTarget !== null && (
        <div style={{ 
          backgroundColor: '#ffeb3b', padding: 10, marginBottom: 10, borderRadius: 4, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <strong>Press the buzzer for Player {calibrationTarget} now...</strong>
          <button onClick={() => window.electronAPI.cancelCalibration()}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <strong style={{ width: 80 }}>Player {p.id}:</strong>
            <input 
              type="text" 
              value={p.name} 
              onChange={(e) => window.electronAPI.updatePlayerName(p.id, e.target.value)}
              placeholder="Enter Name"
              style={{ padding: 5 }}
            />
            <button 
              onClick={() => window.electronAPI.startCalibration(p.id)}
              disabled={calibrationTarget !== null}
              style={{ 
                backgroundColor: p.devicePath ? '#e0ffe0' : '#ffe0e0',
                border: '1px solid #ccc',
                cursor: 'pointer'
              }}
            >
              {p.devicePath ? 'Mapped (Remap)' : 'Map Buzzer'}
            </button>
            <span style={{ fontSize: '0.8em', color: '#888' }}>
              {p.devicePath ? '✓ Ready' : '• No Device'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HostWindow = () => {
  const state = useGameState();
  const { gameState, buzzQueue, earlyBuzzers, timer, players, calibrationTarget } = state;

  const playerMap = useMemo(() => {
    return players.reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {} as Record<number, string>);
  }, [players]);

  const getPlayerName = (id: number) => playerMap[id] || `Player ${id}`;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Host Console</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.electronAPI.openBoardWindow()}>
            Focus Board
          </button>
          <button onClick={() => window.electronAPI.quitApp()} style={{ backgroundColor: '#555', color: 'white' }}>
            Quit App
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', gap: 10, marginBottom: 30, padding: 20, 
        backgroundColor: '#eee', borderRadius: 10, justifyContent: 'center' 
      }}>
        <button 
          onClick={() => window.electronAPI.openFloor()} 
          style={{ 
            fontSize: '1.2rem', padding: '15px 30px', fontWeight: 'bold',
            backgroundColor: gameState === 'OPEN' ? '#ddd' : '#4CAF50',
            color: gameState === 'OPEN' ? '#888' : 'white',
            border: 'none', borderRadius: 5, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5
          }}
        >
          <span>OPEN BUZZERS</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>[⇧⌘O]</span>
        </button>
        
        <button 
          onClick={() => window.electronAPI.resetGame()} 
          style={{ 
            fontSize: '1rem', padding: '15px 20px',
            backgroundColor: '#f44336', color: 'white',
            border: 'none', borderRadius: 5, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5
          }}
        >
          <span>STOP / RESET</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>[⇧⌘R]</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <h3>State</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gameState}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3>Timer</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timer === 0 ? 'red' : 'black' }}>
            {timer}s
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
        <div style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 5 }}>
          <h3>Buzz Queue</h3>
          {buzzQueue.length === 0 ? <p style={{ color: '#888' }}>Waiting for buzz...</p> : (
            <ol style={{ fontSize: '1.2rem' }}>
              {buzzQueue.map((b, i) => (
                <li key={i} style={{ marginBottom: 5 }}>
                  <strong>{getPlayerName(b.player)}</strong> <span style={{ color: '#666' }}>({b.label})</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        
        <div style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 5 }}>
          <h3>Locked Out (Penalty)</h3>
          {earlyBuzzers.length === 0 ? <p style={{ color: '#888' }}>None</p> : (
            <ul style={{ color: 'red' }}>
              {earlyBuzzers.map(p => <li key={p}>{getPlayerName(p)}</li>)}
            </ul>
          )}
        </div>
      </div>

      <PlayerSetup players={players || []} calibrationTarget={calibrationTarget} />

      <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 10 }}>
        <h4>Manual Simulation</h4>
        {[1, 2, 3].map(p => (
           <button key={p} onClick={() => window.electronAPI.simulateBuzz(p)} style={{ marginRight: 10 }}>
             Simulate {getPlayerName(p)}
           </button>
        ))}
      </div>
    </div>
  );
};

const BoardWindow = () => {
  const state = useGameState();
  useAudio(state); 
  
  const { gameState, buzzQueue, earlyBuzzers, timer, players } = state;

<<<<<<< Updated upstream
  const playerMap = useMemo(() => {
    return (players || []).reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {} as Record<number, string>);
  }, [players]);

  const getPlayerName = (id: number) => playerMap[id] || `Player ${id}`;

=======
  const buzzQueuePlayerIds = new Set(buzzQueue.map(b => b.player));

>>>>>>> Stashed changes
  return (
    <div style={{ 
      padding: 20, 
      backgroundColor: '#000088', /* Jeopardy Blue-ish background */
      color: 'white', 
      height: '100vh', 
      fontFamily: "'Oswald', sans-serif", 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      textTransform: 'uppercase' /* Category header style */
    }}>
      <TimerSection timer={timer} gameState={gameState} />

      <StateText gameState={gameState} />
      
      <style>{`
        @keyframes winnerPulse {
          0% { background-color: #0000cc; }
          50% { background-color: #0000ff; }
          100% { background-color: #0000cc; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
<<<<<<< Updated upstream
        <PenaltyDisplay earlyBuzzers={earlyBuzzers} buzzQueue={buzzQueue} getPlayerName={getPlayerName} />
=======
        {/* Penalty / Early Buzzers Display */}
        {earlyBuzzers.filter(pid => !buzzQueuePlayerIds.has(pid)).map(pid => (
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
        ))}
>>>>>>> Stashed changes

        <BuzzQueueDisplay buzzQueue={buzzQueue} getPlayerName={getPlayerName} />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HostWindow />} />
        <Route path="/board" element={<BoardWindow />} />
      </Routes>
    </HashRouter>
  );
};

export default App;