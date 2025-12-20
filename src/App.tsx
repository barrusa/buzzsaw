import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

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

const useAudio = (state: GameStateData) => {
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

  const getPlayerName = (id: number) => players.find(p => p.id === id)?.name || `Player ${id}`;

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
  const getPlayerName = (id: number) => players?.find(p => p.id === id)?.name || `Player ${id}`;
  
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

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
      {/* Timer Section - Adjusted size and margin to prevent overlap */}
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
          textAlign: 'left'
        }}>
          {timer}
        </div>
      </div>

      {/* State Text - Positioned clearly below timer */}
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

      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Penalty / Early Buzzers Display */}
        {earlyBuzzers.filter(pid => !buzzQueue.some(b => b.player === pid)).map(pid => (
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

        {buzzQueue.length > 0 && (
          <div style={{ 
            backgroundColor: '#0000cc', 
            border: '4px solid #ffffff',
            padding: '15px 30px', 
            marginBottom: 10,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              fontSize: '3.5rem', 
              margin: '0',
              textShadow: '3px 3px 0px #000000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
               <span style={{ fontWeight: 'bold' }}>{getPlayerName(buzzQueue[0].player)}</span>
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