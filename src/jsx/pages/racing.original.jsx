import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const Racing = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, betting, running, crashed, won
    const [distance, setDistance] = useState(0);
    const [playerLane, setPlayerLane] = useState(1); // 0, 1, or 2
    const [obstacles, setObstacles] = useState([]);
    const [maxDistance, setMaxDistance] = useState(0);
    const [betHistory, setBetHistory] = useState([]);
    const [serverSeed, setServerSeed] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [clientSeed, setClientSeed] = useState(generateRandomHex());
    // eslint-disable-next-line no-unused-vars
    const [nonce, setNonce] = useState(0);
    
    const gameLoopRef = useRef(null);
    const startTimeRef = useRef(null);
    const obstacleCounterRef = useRef(0);
    const currentBetRef = useRef(0);

    // Generate random lane for obstacle using provably fair
    const generateObstacleLane = useCallback((seed1, seed2, n, obsIndex) => {
        try {
            const hash = deriveHash(seed1, seed2, n + obsIndex);
            const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
            const uint = parseInt(hashStr.substring(0, 8), 16) || 0;
            return uint % 3; // 0, 1, or 2
        } catch (e) {
            return Math.floor(Math.random() * 3);
        }
    }, []);

    // Distance to payout multiplier (progressive reward)
    const getMultiplier = useCallback((dist) => {
        // Every 100 units = 0.5x multiplier
        // 100 units = 1.5x, 200 = 2x, 300 = 2.5x, 400 = 3x, etc.
        // House edge: ~5%
        return Math.floor((1 + dist / 100) * 100 + 50) / 100;
    }, []);

    // Start new game
    const startGame = useCallback(() => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        setGameState('running');
        setBalance(prev => prev - amount);
        setDistance(0);
        setPlayerLane(1);
        setObstacles([]);
        setMaxDistance(0);
        setPlayerLane(Math.floor(Math.random() * 3));
        startTimeRef.current = Date.now();
        currentBetRef.current = amount;
        obstacleCounterRef.current = 0;

        const newSeed = newServerSeed();
        setServerSeed(newSeed);

        // Game loop
        let frame = 0;
        gameLoopRef.current = setInterval(() => {
            frame++;
            
            // Distance increases every frame
            setDistance(prev => {
                const newDist = prev + 5;
                setMaxDistance(Math.max(maxDistance, newDist));
                return newDist;
            });

            // Spawn obstacles every 30 frames (~1.5 seconds)
            if (frame % 30 === 0) {
                const obsLane = generateObstacleLane(newSeed, clientSeed, nonce, obstacleCounterRef.current);
                obstacleCounterRef.current++;
                
                setObstacles(prev => [
                    ...prev,
                    {
                        id: frame,
                        lane: obsLane,
                        y: -50,
                    }
                ]);
            }

            // Move obstacles down
            setObstacles(prev => {
                const updated = prev.map(obs => ({ ...obs, y: obs.y + 8 }));
                
                // Check collisions
                updated.forEach(obs => {
                    if (obs.y > 300 && obs.y < 400) {
                        setPlayerLane(pl => {
                            if (pl === obs.lane) {
                                // Collision! Game over
                                clearInterval(gameLoopRef.current);
                                setGameState('crashed');
                                
                                const mult = getMultiplier(distance);
                                const winnings = Math.floor(currentBetRef.current * mult * 100) / 100;
                                
                                // Only pay out if distance was reasonable
                                if (distance < 50) {
                                    setBalance(prev => prev + currentBetRef.current);
                                    setBetHistory(prev => [...prev, {
                                        amount: currentBetRef.current,
                                        distance: distance,
                                        multiplier: mult.toFixed(2),
                                        result: 'lost',
                                        status: 'collision'
                                    }]);
                                } else {
                                    setBalance(prev => prev + winnings);
                                    setBetHistory(prev => [...prev, {
                                        amount: currentBetRef.current,
                                        distance: distance,
                                        multiplier: mult.toFixed(2),
                                        result: 'won',
                                        winnings: winnings
                                    }]);
                                }
                            }
                            return pl;
                        });
                    }
                });

                // Remove off-screen obstacles
                return updated.filter(obs => obs.y < 500);
            });

            // Max game duration (50 seconds) or player wins
            if (frame > 1000) {
                clearInterval(gameLoopRef.current);
                setGameState('won');
                
                const mult = getMultiplier(distance);
                const winnings = Math.floor(currentBetRef.current * mult * 100) / 100;
                setBalance(prev => prev + winnings);
                
                setBetHistory(prev => [...prev, {
                    amount: currentBetRef.current,
                    distance: distance,
                    multiplier: mult.toFixed(2),
                    result: 'won',
                    status: 'survived',
                    winnings: winnings
                }]);
            }
        }, 50);
    }, [betAmount, balance, clientSeed, nonce, distance, maxDistance, generateObstacleLane, getMultiplier]);

    // Handle keyboard/touch lane changes
    const changeLane = useCallback((newLane) => {
        if (gameState === 'running' && newLane >= 0 && newLane <= 2) {
            setPlayerLane(newLane);
        }
    }, [gameState]);

    // Reset for next round
    const reset = useCallback(() => {
        setGameState('idle');
        setDistance(0);
        setPlayerLane(1);
        setObstacles([]);
        setMaxDistance(0);
        setBetAmount('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                changeLane(Math.max(playerLane - 1, 0));
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                changeLane(Math.min(playerLane + 1, 2));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playerLane, changeLane]);

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
                            <div className="distance-display">
                                <div className="distance-label">Distance</div>
                                <div className="distance-value">{distance}m</div>
                            </div>
                            <div className="multiplier-display">
                                <div className="multiplier-label">Payout</div>
                                <div className="multiplier-value">{getMultiplier(distance).toFixed(2)}x</div>
                            </div>
                            <div className="balance-display">
                                <span>${balance.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Game Canvas */}
                        <div className="race-track">
                            {/* Road */}
                            <div className="track-bg">
                                {/* Lane markings */}
                                <div className="lane-marker"></div>
                                <div className="lane-marker"></div>
                            </div>

                            {/* Obstacles */}
                            {obstacles.map(obs => (
                                <div 
                                    key={obs.id}
                                    className="obstacle"
                                    style={{
                                        left: `${33.33 * obs.lane + 16.66}%`,
                                        top: `${(obs.y / 500) * 100}%`,
                                    }}
                                >
                                    🚧
                                </div>
                            ))}

                            {/* Player */}
                            <div 
                                className="player"
                                style={{
                                    left: `${33.33 * playerLane + 16.66}%`,
                                }}
                            >
                                🏎️
                            </div>

                            {/* Status */}
                            {gameState === 'crashed' && (
                                <div className="game-over-overlay">
                                    <div className="game-over-text">CRASHED!</div>
                                </div>
                            )}
                            {gameState === 'won' && (
                                <div className="game-over-overlay won">
                                    <div className="game-over-text">SURVIVED!</div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="racing-controls">
                            {gameState === 'idle' && (
                                <>
                                    <div className="bet-input-group">
                                        <label>Bet Amount</label>
                                        <input 
                                            type="number" 
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            min="1"
                                            max={balance}
                                            placeholder="Enter bet"
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={startGame}
                                        disabled={!betAmount || parseFloat(betAmount) <= 0}
                                    >
                                        Start Race
                                    </button>
                                </>
                            )}

                            {gameState === 'running' && (
                                <div className="lane-buttons">
                                    <button 
                                        className={`lane-btn left ${playerLane === 0 ? 'active' : ''}`}
                                        onClick={() => changeLane(0)}
                                    >
                                        ← LEFT
                                    </button>
                                    <button 
                                        className={`lane-btn center ${playerLane === 1 ? 'active' : ''}`}
                                        onClick={() => changeLane(1)}
                                    >
                                        CENTER
                                    </button>
                                    <button 
                                        className={`lane-btn right ${playerLane === 2 ? 'active' : ''}`}
                                        onClick={() => changeLane(2)}
                                    >
                                        RIGHT →
                                    </button>
                                </div>
                            )}

                            {(gameState === 'crashed' || gameState === 'won') && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={reset}
                                >
                                    Play Again
                                </button>
                            )}
                        </div>

                        <div className="controls-hint">
                            {gameState === 'running' && (
                                <p>Use Arrow Keys or A/D to move, or tap buttons below</p>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Stats */}
                    <div className="racing-sidebar">
                        <h3>Best Distance</h3>
                        <div className="stat-display">
                            {maxDistance}m
                        </div>

                        <h3 style={{ marginTop: '2rem' }}>Recent Races</h3>
                        <div className="bet-history">
                            {betHistory.length > 0 ? betHistory.slice(-5).reverse().map((bet, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bet-item ${bet.result}`}
                                >
                                    <div className="bet-amount">${bet.amount.toFixed(2)}</div>
                                    <div className="bet-distance">{bet.distance}m</div>
                                    <div className="bet-multiplier">{bet.multiplier}x</div>
                                    <div className="bet-result">
                                        {bet.result === 'won' ? `+$${bet.winnings?.toFixed(2) || '0.00'}` : 'Lost'}
                                    </div>
                                </div>
                            )) : <p>No races yet</p>}
                        </div>
                    </div>
                </div>

                {/* Provably Fair */}
                <ProvablyFairPanel 
                    serverSeed={serverSeed}
                    clientSeed={clientSeed}
                    nonce={nonce}
                    result={`Distance: ${maxDistance}m`}
                />
            </main>

            <style>{`
                .racing-layout {
                    display: flex;
                    gap: 2rem;
                }

                .racing-game {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    flex: 1;
                }

                .racing-info {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                    justify-content: space-between;
                }

                .distance-display, .multiplier-display {
                    background: rgba(0, 255, 0, 0.05);
                    border: 2px solid rgba(0, 255, 0, 0.3);
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                    flex: 1;
                }

                .distance-label, .multiplier-label {
                    font-size: 0.875rem;
                    color: #aaa;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .distance-value, .multiplier-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                    margin-top: 0.5rem;
                }

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
                    width: 100%;
                    height: 100%;
                    background-image: 
                        repeating-linear-gradient(
                            to bottom,
                            #444 0px,
                            #444 2px,
                            transparent 2px,
                            transparent 20px
                        );
                    opacity: 0.3;
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

                .obstacle {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    transform: translateX(-50%);
                    font-size: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }

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
                    transition: left 0.1s ease;
                    z-index: 20;
                }

                .game-over-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                }

                .game-over-overlay.won {
                    background: rgba(0, 255, 0, 0.3);
                }

                .game-over-text {
                    font-size: 4rem;
                    font-weight: bold;
                    color: #ff0000;
                    text-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
                    text-align: center;
                }

                .game-over-overlay.won .game-over-text {
                    color: #00ff00;
                    text-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
                }

                .racing-controls {
                    margin-bottom: 1rem;
                }

                .bet-input-group {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .bet-input-group label {
                    font-size: 0.875rem;
                    color: #aaa;
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
                    transition: all 0.1s ease;
                }

                .lane-btn:hover {
                    border-color: #00ff00;
                    color: #00ff00;
                }

                .lane-btn.active {
                    background: rgba(0, 255, 0, 0.2);
                    border-color: #00ff00;
                    color: #00ff00;
                    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
                }

                .btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                    width: 100%;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
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

                .racing-sidebar {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 200px;
                    max-width: 250px;
                }

                .racing-sidebar h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #aaa;
                }

                .stat-display {
                    background: rgba(0, 255, 0, 0.1);
                    border: 1px solid rgba(0, 255, 0, 0.3);
                    color: #00ff00;
                    padding: 1rem;
                    text-align: center;
                    border-radius: 4px;
                    font-size: 2rem;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                }

                .bet-history {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .bet-item {
                    background: rgba(0, 0, 0, 0.3);
                    border-left: 3px solid #00ff00;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .bet-item.lost {
                    border-left-color: #ff0000;
                }

                .bet-amount {
                    color: #aaa;
                    font-size: 0.75rem;
                }

                .bet-distance {
                    color: #00ff00;
                    font-weight: bold;
                    font-size: 1rem;
                    margin: 0.25rem 0;
                }

                .bet-item.lost .bet-distance {
                    color: #ff6b6b;
                }

                .bet-multiplier {
                    color: #aaa;
                    font-size: 0.75rem;
                }

                .bet-result {
                    color: #aaa;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }
            `}</style>
        </div>
    );
};

export default Racing;
