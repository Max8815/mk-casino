import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

// Game Constants
const GAME_CONFIG = {
  LANE_COUNT: 3,
  INITIAL_LANE: 1,
  OBSTACLE_SPAWN_INTERVAL: 30, // frames
  OBSTACLE_SPEED: 8, // pixels per frame
  PLAYER_Y_POSITION: 20, // percentage from bottom
  COLLISION_ZONE_TOP: 300,
  COLLISION_ZONE_BOTTOM: 400,
  TRACK_HEIGHT: 500, // pixels
  DISTANCE_PER_FRAME: 5,
  GAME_DURATION_FRAMES: 1000,
  GAME_TICK_MS: 50,
  MULTIPLIER_BASE: 1.0,
  MULTIPLIER_PER_100_DISTANCE: 0.5,
};

const GAME_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  CRASHED: 'crashed',
  WON: 'won',
};

// Pure functions for game logic
const calculateMultiplier = (distance) => {
  const multiplier = GAME_CONFIG.MULTIPLIER_BASE + (distance / 100) * GAME_CONFIG.MULTIPLIER_PER_100_DISTANCE;
  return Math.round(multiplier * 100) / 100;
};

const generateObstacleLane = (serverSeed, clientSeed, nonce, obstacleIndex) => {
  try {
    const hash = deriveHash(serverSeed, clientSeed, nonce + obstacleIndex);
    const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
    const uint = parseInt(hashStr.substring(0, 8), 16) || 0;
    return uint % GAME_CONFIG.LANE_COUNT;
  } catch {
    return Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  }
};

const checkCollision = (playerLane, obstacleLane, obstacleY) => {
  const inCollisionZone = obstacleY >= GAME_CONFIG.COLLISION_ZONE_TOP && 
                          obstacleY <= GAME_CONFIG.COLLISION_ZONE_BOTTOM;
  const lanesMatch = playerLane === obstacleLane;
  return inCollisionZone && lanesMatch;
};

const calculateWinnings = (betAmount, distance) => {
  const multiplier = calculateMultiplier(distance);
  return Math.floor(betAmount * multiplier * 100) / 100;
};

const Racing = ({ user, onLogout }) => {
  // Core game state
  const [balance, setBalance] = useState(user?.balance || 1000);
  const [betAmount, setBetAmount] = useState('10');
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [distance, setDistance] = useState(0);
  const [playerLane, setPlayerLane] = useState(GAME_CONFIG.INITIAL_LANE);
  const [obstacles, setObstacles] = useState([]);
  const [maxDistance, setMaxDistance] = useState(0);
  const [betHistory, setBetHistory] = useState([]);
  
  // Provably Fair
  const [serverSeed, setServerSeed] = useState(null);
  const [clientSeed] = useState(() => generateRandomHex());
  const [nonce, setNonce] = useState(0);

  // Refs for game loop and current state
  const gameLoopRef = useRef(null);
  const gameStateRef = useRef({
    isRunning: false,
    distance: 0,
    playerLane: GAME_CONFIG.INITIAL_LANE,
    frame: 0,
    obstacleCounter: 0,
    currentBet: 0,
  });

  // Update game state ref when state changes
  useEffect(() => {
    gameStateRef.current.distance = distance;
    gameStateRef.current.playerLane = playerLane;
  }, [distance, playerLane]);

  // Move lane with bounds checking
  const changeLane = useCallback((newLane) => {
    if (gameState === GAME_STATES.RUNNING) {
      const boundedLane = Math.max(0, Math.min(newLane, GAME_CONFIG.LANE_COUNT - 1));
      setPlayerLane(boundedLane);
    }
  }, [gameState]);

  // Handle left/right lane movement
  const moveLeft = useCallback(() => changeLane(playerLane - 1), [playerLane, changeLane]);
  const moveRight = useCallback(() => changeLane(playerLane + 1), [playerLane, changeLane]);

  // Start new game
  const startGame = useCallback(() => {
    const amount = parseFloat(betAmount) || 0;
    
    if (amount <= 0) {
      alert('Bet amount must be greater than 0');
      return;
    }
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    // Initialize game state
    const newSeed = newServerSeed();
    const startingLane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
    
    setServerSeed(newSeed);
    setGameState(GAME_STATES.RUNNING);
    setBalance(prev => prev - amount);
    setDistance(0);
    setPlayerLane(startingLane);
    setObstacles([]);
    setMaxDistance(0);
    setNonce(prev => prev + 1);

    // Reset game state ref
    gameStateRef.current = {
      isRunning: true,
      distance: 0,
      playerLane: startingLane,
      frame: 0,
      obstacleCounter: 0,
      currentBet: amount,
    };

    // Game loop
    let frame = 0;
    gameLoopRef.current = setInterval(() => {
      frame++;
      const state = gameStateRef.current;

      // Update distance
      const newDistance = state.distance + GAME_CONFIG.DISTANCE_PER_FRAME;
      state.distance = newDistance;
      setDistance(newDistance);
      setMaxDistance(prev => Math.max(prev, newDistance));

      // Spawn obstacles
      if (frame % GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL === 0) {
        const obsLane = generateObstacleLane(newSeed, clientSeed, nonce, state.obstacleCounter);
        state.obstacleCounter++;

        setObstacles(prev => [
          ...prev,
          {
            id: frame,
            lane: obsLane,
            y: 0,
          }
        ]);
      }

      // Move and check obstacles
      setObstacles(prev => {
        const updated = prev.map(obs => ({
          ...obs,
          y: obs.y + GAME_CONFIG.OBSTACLE_SPEED
        }));

        // Check for collisions
        for (const obs of updated) {
          if (checkCollision(state.playerLane, obs.lane, obs.y)) {
            handleCollision(state);
            return updated.filter(o => o.y < GAME_CONFIG.TRACK_HEIGHT);
          }
        }

        return updated.filter(o => o.y < GAME_CONFIG.TRACK_HEIGHT);
      });

      // Check win condition (survived duration)
      if (frame >= GAME_CONFIG.GAME_DURATION_FRAMES) {
        handleSurvival(state);
      }
    }, GAME_CONFIG.GAME_TICK_MS);
  }, [betAmount, balance, clientSeed, nonce]);

  // Handle collision end state
  const handleCollision = useCallback((state) => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    const distance = state.distance;
    const betAmount = state.currentBet;
    const multiplier = calculateMultiplier(distance);
    const winnings = calculateWinnings(betAmount, distance);

    setGameState(GAME_STATES.CRASHED);
    setBalance(prev => prev + winnings);
    setBetHistory(prev => [
      ...prev,
      {
        amount: betAmount,
        distance: distance,
        multiplier: multiplier.toFixed(2),
        result: 'crashed',
        winnings: winnings > 0 ? winnings : 0,
        isWin: winnings > betAmount,
      }
    ]);
  }, []);

  // Handle survival end state
  const handleSurvival = useCallback((state) => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    const distance = state.distance;
    const betAmount = state.currentBet;
    const multiplier = calculateMultiplier(distance);
    const winnings = calculateWinnings(betAmount, distance);

    setGameState(GAME_STATES.WON);
    setBalance(prev => prev + winnings);
    setBetHistory(prev => [
      ...prev,
      {
        amount: betAmount,
        distance: distance,
        multiplier: multiplier.toFixed(2),
        result: 'survived',
        winnings: winnings,
        isWin: true,
      }
    ]);
  }, []);

  // Reset for next round
  const reset = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    setGameState(GAME_STATES.IDLE);
    setDistance(0);
    setPlayerLane(GAME_CONFIG.INITIAL_LANE);
    setObstacles([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        moveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight]);

  // Memoized values
  const currentMultiplier = useMemo(() => calculateMultiplier(distance), [distance]);
  const isGameRunning = gameState === GAME_STATES.RUNNING;
  const isGameEnded = gameState === GAME_STATES.CRASHED || gameState === GAME_STATES.WON;
  const isWon = gameState === GAME_STATES.WON;
  const isCrashed = gameState === GAME_STATES.CRASHED;

  // Obstacle styles (memoized to reduce re-renders)
  const obstacleElements = useMemo(() => 
    obstacles.map(obs => (
      <div 
        key={obs.id}
        className="obstacle"
        style={{
          left: `${(100 / GAME_CONFIG.LANE_COUNT) * obs.lane + (100 / GAME_CONFIG.LANE_COUNT / 2)}%`,
          top: `${(obs.y / GAME_CONFIG.TRACK_HEIGHT) * 100}%`,
        }}
      >
        🚧
      </div>
    )),
    [obstacles]
  );

  // Player position (memoized)
  const playerStyle = useMemo(() => ({
    left: `${(100 / GAME_CONFIG.LANE_COUNT) * playerLane + (100 / GAME_CONFIG.LANE_COUNT / 2)}%`,
  }), [playerLane]);

  // Render bet history
  const recentBets = useMemo(() => 
    betHistory.slice(-5).reverse(),
    [betHistory]
  );

  return (
    <div className="app-layout">
      <Header user={user} onLogout={onLogout} />
      <Sidebar />
      
      <main className="game-container">
        <h1>Racing</h1>
        <div className="game-content racing-layout">
          
          {/* Main Game Area */}
          <div className="racing-game">
            <div className="racing-info">
              <div className="info-box">
                <div className="info-label">Distance</div>
                <div className="info-value">{distance}m</div>
              </div>
              <div className="info-box">
                <div className="info-label">Payout</div>
                <div className="info-value">{currentMultiplier.toFixed(2)}x</div>
              </div>
              <div className="info-box">
                <div className="info-label">Balance</div>
                <div className="info-value balance">${balance.toFixed(2)}</div>
              </div>
            </div>

            {/* Game Track */}
            <div className="race-track">
              <div className="track-bg">
                <div className="lane-marker"></div>
                <div className="lane-marker"></div>
              </div>

              {/* Obstacles */}
              {obstacleElements}

              {/* Player */}
              <div className="player" style={playerStyle}>
                🏎️
              </div>

              {/* Game Over Overlays */}
              {isCrashed && (
                <div className="game-over-overlay crashed">
                  <div className="game-over-text">CRASHED!</div>
                </div>
              )}
              {isWon && (
                <div className="game-over-overlay won">
                  <div className="game-over-text">SURVIVED!</div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="racing-controls">
              {gameState === GAME_STATES.IDLE && (
                <>
                  <div className="bet-input-group">
                    <label htmlFor="bet-input">Bet Amount</label>
                    <input 
                      id="bet-input"
                      type="number" 
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="1"
                      max={balance}
                      placeholder="Enter bet amount"
                      disabled={gameState !== GAME_STATES.IDLE}
                    />
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={startGame}
                    disabled={!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance}
                  >
                    Start Race
                  </button>
                </>
              )}

              {isGameRunning && (
                <div className="lane-buttons">
                  <button 
                    className={`lane-btn left ${playerLane === 0 ? 'active' : ''}`}
                    onClick={moveLeft}
                    title="Move left (Arrow Left or A key)"
                  >
                    ← LEFT
                  </button>
                  <button 
                    className={`lane-btn center ${playerLane === 1 ? 'active' : ''}`}
                    onClick={() => changeLane(1)}
                    title="Stay center"
                  >
                    CENTER
                  </button>
                  <button 
                    className={`lane-btn right ${playerLane === 2 ? 'active' : ''}`}
                    onClick={moveRight}
                    title="Move right (Arrow Right or D key)"
                  >
                    RIGHT →
                  </button>
                </div>
              )}

              {isGameEnded && (
                <button 
                  className="btn btn-primary"
                  onClick={reset}
                >
                  Play Again
                </button>
              )}
            </div>

            <div className="controls-hint">
              {isGameRunning && (
                <p>Use Arrow Keys or A/D to move left/right</p>
              )}
            </div>
          </div>

          {/* Right Sidebar - Stats */}
          <div className="racing-sidebar">
            <div className="sidebar-section">
              <h3>Best Distance</h3>
              <div className="stat-display">
                {maxDistance}m
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Recent Races</h3>
              <div className="bet-history">
                {recentBets.length > 0 ? (
                  recentBets.map((bet, idx) => (
                    <div 
                      key={idx} 
                      className={`bet-item ${bet.isWin ? 'win' : 'loss'}`}
                    >
                      <div className="bet-row">
                        <span className="bet-distance">{bet.distance}m</span>
                        <span className="bet-multiplier">{bet.multiplier}x</span>
                      </div>
                      <div className="bet-row">
                        <span className="bet-amount">${bet.amount.toFixed(2)}</span>
                        <span className={`bet-result ${bet.isWin ? 'win' : 'loss'}`}>
                          {bet.isWin ? `+$${bet.winnings.toFixed(2)}` : `-$${bet.amount.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-races">No races yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Provably Fair */}
        <ProvablyFairPanel 
          serverSeed={serverSeed}
          clientSeed={clientSeed}
          nonce={nonce}
          result={`Distance: ${maxDistance}m, Multiplier: ${calculateMultiplier(maxDistance).toFixed(2)}x`}
        />
      </main>

      <style>{`
        /* Layout */
        .racing-layout {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .racing-game {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1.5rem;
          flex: 1;
        }

        /* Info Display */
        .racing-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          justify-content: space-between;
        }

        .info-box {
          background: rgba(0, 255, 0, 0.05);
          border: 2px solid rgba(0, 255, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          flex: 1;
          min-width: 100px;
        }

        .info-label {
          font-size: 0.875rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .info-value {
          font-size: 2rem;
          font-weight: bold;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .info-value.balance {
          color: #ffaa00;
          text-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
        }

        /* Game Track */
        .race-track {
          position: relative;
          width: 100%;
          height: 400px;
          background: linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          border: 2px solid #555;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .track-bg {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            to bottom,
            #444 0px,
            #444 2px,
            transparent 2px,
            transparent 20px
          );
          opacity: 0.3;
          pointer-events: none;
        }

        .lane-marker {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          left: 33.33%;
        }

        .lane-marker:nth-child(2) {
          left: 66.66%;
        }

        /* Obstacle */
        .obstacle {
          position: absolute;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          font-size: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        /* Player */
        .player {
          position: absolute;
          bottom: 20px;
          width: 40px;
          height: 40px;
          transform: translateX(-50%);
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: left 0.1s ease-out;
          z-index: 20;
        }

        /* Game Over Overlays */
        .game-over-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.3s ease-out;
        }

        .game-over-overlay.won {
          background: rgba(0, 255, 0, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .game-over-text {
          font-size: 4rem;
          font-weight: bold;
          color: #ff0000;
          text-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
          text-align: center;
          animation: scaleIn 0.3s ease-out;
        }

        .game-over-overlay.won .game-over-text {
          color: #00ff00;
          text-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Controls */
        .racing-controls {
          margin-bottom: 1rem;
        }

        .bet-input-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;
        }

        .bet-input-group label {
          font-size: 0.875rem;
          color: #aaa;
          white-space: nowrap;
        }

        .bet-input-group input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #555;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-radius: 4px;
          font-size: 1rem;
          min-width: 100px;
          transition: border-color 0.2s ease;
        }

        .bet-input-group input:focus {
          outline: none;
          border-color: #00ff00;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
        }

        .bet-input-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lane-buttons {
          display: flex;
          gap: 1rem;
        }

        .lane-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #555;
          background: rgba(255, 255, 255, 0.05);
          color: #aaa;
          border-radius: 4px;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lane-btn:hover {
          border-color: #00ff00;
          color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
        }

        .lane-btn.active {
          background: rgba(0, 255, 0, 0.25);
          border-color: #00ff00;
          color: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.4);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          width: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .controls-hint {
          text-align: center;
          color: #aaa;
          font-size: 0.875rem;
          margin-top: 1rem;
        }

        /* Sidebar */
        .racing-sidebar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1.5rem;
          min-width: 240px;
          max-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .sidebar-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-display {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.3);
          color: #00ff00;
          padding: 1.5rem;
          text-align: center;
          border-radius: 4px;
          font-size: 2.5rem;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }

        /* Bet History */
        .bet-history {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .bet-history::-webkit-scrollbar {
          width: 6px;
        }

        .bet-history::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .bet-history::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.3);
          border-radius: 3px;
        }

        .bet-history::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.5);
        }

        .bet-item {
          background: rgba(0, 0, 0, 0.3);
          border-left: 4px solid #00ff00;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .bet-item.loss {
          border-left-color: #ff6b6b;
        }

        .bet-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .bet-row:last-child {
          margin-bottom: 0;
        }

        .bet-distance {
          color: #00ff00;
          font-weight: bold;
          font-size: 0.875rem;
        }

        .bet-multiplier {
          color: #aaa;
          font-size: 0.75rem;
        }

        .bet-amount {
          color: #aaa;
          font-size: 0.75rem;
        }

        .bet-result {
          font-weight: bold;
          font-size: 0.75rem;
        }

        .bet-result.win {
          color: #00ff00;
        }

        .bet-result.loss {
          color: #ff6b6b;
        }

        .no-races {
          color: #aaa;
          text-align: center;
          padding: 1rem;
          font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .racing-layout {
            flex-direction: column;
          }

          .racing-sidebar {
            min-width: unset;
            max-width: unset;
            flex-direction: row;
            gap: 1rem;
          }

          .sidebar-section {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .racing-game {
            padding: 1rem;
          }

          .race-track {
            height: 300px;
            margin-bottom: 1rem;
          }

          .racing-info {
            flex-direction: column;
            gap: 0.75rem;
          }

          .info-box {
            padding: 0.75rem;
          }

          .info-value {
            font-size: 1.5rem;
          }

          .lane-buttons {
            gap: 0.5rem;
          }

          .lane-btn {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }

          .racing-sidebar {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Racing;
