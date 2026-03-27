import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const Crash = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, betting, running, crashed, won
    const [multiplier, setMultiplier] = useState(1.0);
    const [crashPoint, setCrashPoint] = useState(null);
    const [history, setHistory] = useState([]);
    const [betHistory, setBetHistory] = useState([]);
    const [serverSeed, setServerSeed] = useState(null);
    const [clientSeed, setClientSeed] = useState(generateRandomHex());
    const [nonce, setNonce] = useState(0);
    
    const gameLoopRef = useRef(null);
    const startTimeRef = useRef(null);
    const cachedCrashRef = useRef(null);

    // Generate crash point using provably fair
    const generateCrashPoint = useCallback((seed1, seed2, n) => {
        try {
            const hash = deriveHash(seed1, seed2, n);
            const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
            const uint = parseInt(hashStr.substring(0, 8), 16) || 0;
            // Map to range [1.01, ~200] with exponential distribution
            // ~5% house edge
            const normalized = (uint % 10000) / 10000;
            const crash = 1 + Math.exp(normalized * 5.5);
            return Math.floor(crash * 100) / 100;
        } catch (e) {
            // Fallback: random crash between 1.01 and 20x
            return Math.floor((1 + Math.random() * 19) * 100) / 100;
        }
    }, []);

    // Start new game
    const startGame = useCallback(() => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        setGameState('running');
        setBalance(balance - amount);
        setMultiplier(1.0);
        startTimeRef.current = Date.now();

        // Generate crash point
        const newSeed = newServerSeed();
        setServerSeed(newSeed);
        const crash = generateCrashPoint(newSeed, clientSeed, nonce);
        cachedCrashRef.current = crash;
        setCrashPoint(crash);

        // Game loop
        let frame = 0;
        gameLoopRef.current = setInterval(() => {
            frame++;
            // Multiplier increases ~0.02 per frame (50ms = 1 frame)
            const newMult = 1 + (frame * 0.001);
            setMultiplier(Math.floor(newMult * 100) / 100);

            if (newMult >= crash) {
                clearInterval(gameLoopRef.current);
                setGameState('crashed');
                setMultiplier(crash);
                setCrashPoint(crash);
                setBetHistory(prev => [...prev, { amount, multiplier: crash, result: 'lost', status: 'crashed' }]);
                setHistory(prev => [crash, ...prev.slice(0, 49)]);
            }
        }, 50);
    }, [betAmount, balance, clientSeed, nonce, generateCrashPoint]);

    // Cashout
    const cashout = useCallback(() => {
        if (gameState !== 'running' || !multiplier) return;

        clearInterval(gameLoopRef.current);
        const amount = parseFloat(betAmount) || 0;
        const winnings = Math.floor(amount * multiplier * 100) / 100;
        setBalance(prev => prev + winnings);
        setGameState('won');
        
        setBetHistory(prev => [...prev, { 
            amount, 
            multiplier: multiplier.toFixed(2), 
            result: 'won', 
            status: 'cashout',
            winnings
        }]);
        setHistory(prev => [multiplier.toFixed(2), ...prev.slice(0, 49)]);

        setNonce(n => n + 1);
        setClientSeed(generateRandomHex());
    }, [gameState, multiplier, betAmount]);

    // Reset for next round
    const reset = useCallback(() => {
        setGameState('idle');
        setMultiplier(1.0);
        setCrashPoint(null);
        setBetAmount('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, []);

    return (
        <div className="app-layout">
            <Header user={user} onLogout={onLogout} />
            <Sidebar />
            
            <main className="game-container">
                <h1>Crash</h1>
                <div className="game-content">
                    
                    {/* Main Game Area */}
                    <div className="crash-game">
                        {/* Multiplier Display */}
                        <div className={`multiplier-display ${gameState === 'crashed' ? 'crashed' : ''}`}>
                            <div className="multiplier-value">
                                {multiplier.toFixed(2)}x
                            </div>
                            {gameState === 'crashed' && (
                                <div className="crash-label">CRASHED</div>
                            )}
                        </div>

                        {/* Graph/Curve visualization */}
                        <div className="crash-graph">
                            <svg width="100%" height="200" viewBox="0 0 400 200">
                                {/* Grid */}
                                {[...Array(5)].map((_, i) => (
                                    <line 
                                        key={`v-${i}`}
                                        x1={i * 100} y1="0" 
                                        x2={i * 100} y2="200" 
                                        stroke="#444" strokeWidth="0.5"
                                    />
                                ))}
                                {[...Array(5)].map((_, i) => (
                                    <line 
                                        key={`h-${i}`}
                                        x1="0" y1={i * 50} 
                                        x2="400" y2={i * 50} 
                                        stroke="#444" strokeWidth="0.5"
                                    />
                                ))}

                                {/* Curve */}
                                {gameState === 'running' || gameState === 'crashed' || gameState === 'won' ? (
                                    <path
                                        d={`M 0 200 Q 100 ${Math.max(0, 200 - multiplier * 30)} 400 ${Math.max(0, 200 - (crashPoint || multiplier) * 30)}`}
                                        stroke="#00ff00"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                ) : null}
                            </svg>
                        </div>

                        {/* Controls */}
                        <div className="crash-controls">
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
                                        Place Bet
                                    </button>
                                </>
                            )}

                            {(gameState === 'running') && (
                                <button 
                                    className="btn btn-success"
                                    onClick={cashout}
                                >
                                    Cash Out @ {multiplier.toFixed(2)}x
                                </button>
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

                        {/* Balance */}
                        <div className="balance-display">
                            Balance: ${balance.toFixed(2)}
                        </div>
                    </div>

                    {/* Right Sidebar - History */}
                    <div className="crash-sidebar">
                        <h3>Previous Crashes</h3>
                        <div className="history-grid">
                            {history.length > 0 ? history.slice(0, 12).map((crash, idx) => (
                                <div 
                                    key={idx} 
                                    className={`history-item ${parseFloat(crash) <= 1.5 ? 'low' : 'high'}`}
                                >
                                    {crash}x
                                </div>
                            )) : <p>No history yet</p>}
                        </div>

                        <h3 style={{ marginTop: '2rem' }}>Bet History</h3>
                        <div className="bet-history">
                            {betHistory.length > 0 ? betHistory.slice(-5).reverse().map((bet, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bet-item ${bet.result}`}
                                >
                                    <div className="bet-amount">${bet.amount.toFixed(2)}</div>
                                    <div className="bet-multiplier">{bet.multiplier}x</div>
                                    <div className="bet-result">
                                        {bet.result === 'won' ? `+$${bet.winnings.toFixed(2)}` : 'Lost'}
                                    </div>
                                </div>
                            )) : <p>No bets yet</p>}
                        </div>
                    </div>
                </div>

                {/* Provably Fair */}
                <ProvablyFairPanel 
                    serverSeed={serverSeed}
                    clientSeed={clientSeed}
                    nonce={nonce}
                    result={crashPoint}
                />
            </main>

            <style>{`
                .crash-game {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    flex: 1;
                }

                .multiplier-display {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding: 2rem;
                    background: rgba(0, 255, 0, 0.05);
                    border: 2px solid rgba(0, 255, 0, 0.3);
                    border-radius: 8px;
                    transition: all 0.1s ease;
                }

                .multiplier-display.crashed {
                    background: rgba(255, 0, 0, 0.1);
                    border-color: rgba(255, 0, 0, 0.5);
                }

                .multiplier-value {
                    font-size: 4rem;
                    font-weight: bold;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                }

                .multiplier-display.crashed .multiplier-value {
                    color: #ff0000;
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                }

                .crash-label {
                    color: #ff0000;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-top: 0.5rem;
                }

                .crash-graph {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 2rem;
                    height: 250px;
                }

                .crash-controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }

                .bet-input-group {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-width: 150px;
                }

                .bet-input-group label {
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                    color: #aaa;
                }

                .bet-input-group input {
                    padding: 0.75rem;
                    border: 1px solid #555;
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    border-radius: 4px;
                    font-size: 1rem;
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
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
                }

                .btn-success {
                    background: #28a745;
                    color: white;
                    font-size: 1.1rem;
                    padding: 1rem 2rem;
                    flex: 1;
                }

                .btn-success:hover {
                    background: #1e7e34;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .balance-display {
                    text-align: center;
                    font-size: 1.25rem;
                    color: #00ff00;
                    margin-top: 1rem;
                }

                .game-content {
                    display: flex;
                    gap: 2rem;
                }

                .crash-sidebar {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 200px;
                    max-width: 250px;
                }

                .crash-sidebar h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #aaa;
                }

                .history-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                }

                .history-item {
                    background: rgba(0, 255, 0, 0.1);
                    border: 1px solid rgba(0, 255, 0, 0.3);
                    color: #00ff00;
                    padding: 0.5rem;
                    text-align: center;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    font-weight: bold;
                }

                .history-item.low {
                    background: rgba(255, 0, 0, 0.1);
                    border-color: rgba(255, 0, 0, 0.3);
                    color: #ff6b6b;
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

                .bet-multiplier {
                    color: #00ff00;
                    font-weight: bold;
                    font-size: 1rem;
                }

                .bet-item.lost .bet-multiplier {
                    color: #ff0000;
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

export default Crash;
