import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const TapFrenzy = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, playing, gameover, won
    const [currentColor, setCurrentColor] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [speed, setSpeed] = useState(800); // interval in ms
    const [tapCount, setTapCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [history, setHistory] = useState([]);
    const [serverSeed, setServerSeed] = useState(null);
    const [clientSeed, setClientSeed] = useState(generateRandomHex());
    const [nonce, setNonce] = useState(0);
    const [winMultiplier, setWinMultiplier] = useState(1);

    const gameLoopRef = useRef(null);
    const timerRef = useRef(null);
    const colorSequenceRef = useRef([]);
    const sequenceIndexRef = useRef(0);
    const currentSpeedRef = useRef(800);

    const COLORS = ['RED', 'GREEN', 'BLUE'];
    const CORRECT_COLOR = 'GREEN';
    const TARGET_TAPS = 10;
    const GAME_DURATION = 30000; // 30 seconds

    const generateColorSequence = useCallback((seed1, seed2, count) => {
        const colors = [];
        try {
            for (let i = 0; i < count; i++) {
                const hash = deriveHash(seed1, seed2, nonce * 1000 + i);
                const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
                const uint = parseInt(hashStr.substring(0, 2), 16) || 0;
                colors.push(COLORS[uint % 3]);
            }
        } catch {
            // Fallback: random sequence
            for (let i = 0; i < count; i++) {
                colors.push(COLORS[Math.floor(Math.random() * 3)]);
            }
        }
        return colors;
    }, [nonce]);

    // Handle game loop - changes colors at intervals
    useEffect(() => {
        if (gameState !== 'playing') {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
            return;
        }

        const sequence = colorSequenceRef.current;
        
        // Clear existing interval
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
        }

        // Create new interval with current speed
        gameLoopRef.current = setInterval(() => {
            setCurrentColor(prevColor => {
                const nextIndex = sequenceIndexRef.current;
                if (nextIndex < sequence.length) {
                    const color = sequence[nextIndex];
                    sequenceIndexRef.current++;
                    return color;
                }
                // If sequence runs out, regenerate more colors
                return prevColor;
            });
        }, currentSpeedRef.current);

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
        };
    }, [gameState]);

    // Handle timer countdown
    useEffect(() => {
        if (gameState !== 'playing') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const startTime = Date.now();
        
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, GAME_DURATION - elapsed);
            
            setTimeLeft(remaining);

            if (remaining === 0) {
                // Time's up - end game
                clearInterval(timerRef.current);
                timerRef.current = null;
                if (score >= TARGET_TAPS) {
                    endGameWon(score);
                } else {
                    endGameLose();
                }
            }
        }, 100);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [gameState, score]);

    const startGame = useCallback(() => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        setBalance(prev => prev - amount);
        setGameState('playing');
        setScore(0);
        setStreak(0);
        setSpeed(800);
        setTapCount(0);
        setWinMultiplier(1);
        setTimeLeft(GAME_DURATION);
        currentSpeedRef.current = 800;

        const newSeed = newServerSeed();
        setServerSeed(newSeed);

        // Generate larger color sequence (200 colors for 30s game)
        const sequence = generateColorSequence(newSeed, clientSeed, 200);
        colorSequenceRef.current = sequence;
        sequenceIndexRef.current = 0;
        setCurrentColor(null);
    }, [betAmount, balance, clientSeed, generateColorSequence]);

    const handleTap = useCallback(() => {
        if (gameState !== 'playing') return;

        const isCorrect = currentColor === CORRECT_COLOR;

        if (isCorrect) {
            setScore(prevScore => {
                const newScore = prevScore + 1;
                
                // Increase speed every 3 correct taps
                if (newScore % 3 === 0) {
                    setSpeed(prevSpeed => {
                        const newSpeed = Math.max(300, prevSpeed - 50);
                        currentSpeedRef.current = newSpeed;
                        return newSpeed;
                    });
                }

                // Check if won
                if (newScore >= TARGET_TAPS) {
                    endGameWon(newScore);
                }

                return newScore;
            });
            
            setStreak(prev => prev + 1);
            setTapCount(prev => prev + 1);
        } else {
            // Wrong tap = game over
            endGameLose();
        }
    }, [gameState, currentColor]);

    const endGameWon = useCallback((finalScore) => {
        clearInterval(gameLoopRef.current);
        clearInterval(timerRef.current);
        gameLoopRef.current = null;
        timerRef.current = null;
        
        setGameState('won');

        const amount = parseFloat(betAmount) || 0;
        const multiplier = 1 + (finalScore * 0.1); // 1.0x to 2.0x based on score
        const winnings = Math.floor(amount * multiplier * 100) / 100;

        setBalance(prev => prev + winnings);
        setWinMultiplier(multiplier);

        setHistory(prev => [{
            score: finalScore,
            result: 'won',
            amount: amount,
            winnings: winnings,
            multiplier: multiplier.toFixed(2)
        }, ...prev.slice(0, 9)]);

        setNonce(n => n + 1);
        setClientSeed(generateRandomHex());
    }, [betAmount]);

    const endGameLose = useCallback(() => {
        clearInterval(gameLoopRef.current);
        clearInterval(timerRef.current);
        gameLoopRef.current = null;
        timerRef.current = null;
        
        setGameState('gameover');

        const amount = parseFloat(betAmount) || 0;
        setHistory(prev => [{
            score: score,
            result: 'lost',
            amount: amount,
            winnings: 0,
            multiplier: '0x'
        }, ...prev.slice(0, 9)]);

        setNonce(n => n + 1);
        setClientSeed(generateRandomHex());
    }, [score, betAmount]);

    const resetGame = useCallback(() => {
        clearInterval(gameLoopRef.current);
        clearInterval(timerRef.current);
        gameLoopRef.current = null;
        timerRef.current = null;
        
        setGameState('idle');
        setCurrentColor(null);
        setScore(0);
        setStreak(0);
        setSpeed(800);
        setTimeLeft(0);
        setBetAmount('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const colorClass = currentColor ? currentColor.toLowerCase() : '';
    const colorBg = {
        'red': 'rgba(255, 0, 0, 0.8)',
        'green': 'rgba(0, 255, 0, 0.8)',
        'blue': 'rgba(0, 0, 255, 0.8)'
    };

    const timeLeftSeconds = Math.ceil(timeLeft / 1000);

    return (
        <div className="app-layout">
            <Header user={user} onLogout={onLogout} />
            <Sidebar />

            <main className="game-container">
                <h1>Tap Frenzy</h1>
                <div className="game-content">

                    <div className="tapfrenzy-game">
                        {/* Large Tap Area */}
                        <div 
                            className={`tap-area ${colorClass}`}
                            style={{
                                backgroundColor: currentColor ? colorBg[colorClass] : 'rgba(50, 50, 80, 0.8)',
                                cursor: gameState === 'playing' ? 'pointer' : 'default'
                            }}
                            onClick={handleTap}
                        >
                            <div className="tap-content">
                                {gameState === 'idle' && (
                                    <div className="idle-message">
                                        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ready to Tap?</div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Click START to begin</div>
                                    </div>
                                )}

                                {gameState === 'playing' && (
                                    <div className="playing-message">
                                        <div className="color-name">
                                            {currentColor || 'WAITING...'}
                                        </div>
                                        <div style={{ fontSize: '2rem', marginTop: '1rem', color: '#fff' }}>
                                            {currentColor === 'GREEN' ? '✓ TAP!' : currentColor === 'RED' ? '✗ AVOID' : '?'}
                                        </div>
                                    </div>
                                )}

                                {gameState === 'gameover' && (
                                    <div className="gameover-message">
                                        <div className="title">GAME OVER!</div>
                                        <div className="score">Score: {score}/{TARGET_TAPS}</div>
                                        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#ff6b6b' }}>
                                            {score >= TARGET_TAPS ? 'Time\'s up!' : 'Wrong color tapped!'}
                                        </div>
                                    </div>
                                )}

                                {gameState === 'won' && (
                                    <div className="won-message">
                                        <div className="title">YOU WIN!</div>
                                        <div className="score">Score: {score}/{TARGET_TAPS}</div>
                                        <div className="multiplier">×{winMultiplier.toFixed(2)}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Score Display */}
                        <div className="score-display">
                            <div className="score-box">
                                <span className="label">Score:</span>
                                <span className="value">{score}/{TARGET_TAPS}</span>
                            </div>
                            <div className="score-box">
                                <span className="label">Streak:</span>
                                <span className="value" style={{ color: streak > 5 ? '#00ff00' : '#aaa' }}>{streak}</span>
                            </div>
                            <div className="score-box">
                                <span className="label">Speed:</span>
                                <span className="value">{speed}ms</span>
                            </div>
                            {gameState === 'playing' && (
                                <div className="score-box">
                                    <span className="label">Time:</span>
                                    <span className="value" style={{ color: timeLeftSeconds < 5 ? '#ff6b6b' : '#aaa' }}>
                                        {timeLeftSeconds}s
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="tapfrenzy-controls">
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
                                        START GAME
                                    </button>
                                </>
                            )}

                            {(gameState === 'gameover' || gameState === 'won') && (
                                <button
                                    className="btn btn-primary"
                                    onClick={resetGame}
                                >
                                    Play Again
                                </button>
                            )}

                            {gameState === 'playing' && (
                                <div style={{ color: '#aaa', textAlign: 'center', fontSize: '0.9rem' }}>
                                    TAP GREEN - AVOID RED & BLUE
                                </div>
                            )}
                        </div>

                        <div className="balance-display">
                            Balance: ${balance.toFixed(2)}
                        </div>
                    </div>

                    {/* History */}
                    <div className="tapfrenzy-sidebar">
                        <h3>Recent Games</h3>
                        <div className="history-list">
                            {history.length > 0 ? history.map((game, idx) => (
                                <div
                                    key={idx}
                                    className={`history-item ${game.result}`}
                                >
                                    <div className="game-info">
                                        <span className="score">Score: {game.score}</span>
                                        <span className="multiplier">{game.multiplier}</span>
                                    </div>
                                    <div className="game-result">
                                        {game.result === 'won' ? `+$${game.winnings.toFixed(2)}` : `-$${game.amount.toFixed(2)}`}
                                    </div>
                                </div>
                            )) : <p>No games yet</p>}
                        </div>
                    </div>
                </div>

                <ProvablyFairPanel
                    serverSeed={serverSeed}
                    clientSeed={clientSeed}
                    nonce={nonce}
                    result={`Score: ${score}`}
                />
            </main>

            <style>{`
                .tapfrenzy-game {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 2rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .tap-area {
                    flex: 1;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 2rem;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    min-height: 300px;
                    position: relative;
                    overflow: hidden;
                }

                .tap-area.red {
                    background: rgba(255, 0, 0, 0.8) !important;
                    border-color: rgba(255, 0, 0, 0.5);
                    box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
                }

                .tap-area.green {
                    background: rgba(0, 255, 0, 0.8) !important;
                    border-color: rgba(0, 255, 0, 0.5);
                    box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
                }

                .tap-area.blue {
                    background: rgba(0, 0, 255, 0.8) !important;
                    border-color: rgba(0, 0, 255, 0.5);
                    box-shadow: 0 0 30px rgba(0, 0, 255, 0.5);
                }

                .tap-content {
                    text-align: center;
                    z-index: 10;
                }

                .idle-message, .playing-message, .gameover-message, .won-message {
                    color: #fff;
                    font-weight: bold;
                }

                .color-name {
                    font-size: 3.5rem;
                    font-weight: 900;
                    text-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
                    font-family: 'Courier New', monospace;
                }

                .gameover-message .title, .won-message .title {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }

                .gameover-message .score, .won-message .score {
                    font-size: 1.5rem;
                    margin: 1rem 0;
                }

                .won-message .multiplier {
                    font-size: 2rem;
                    color: #00ff00;
                    margin-top: 1rem;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                }

                .score-display {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .score-box {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid #555;
                    border-radius: 6px;
                    padding: 0.75rem 1.5rem;
                    text-align: center;
                }

                .score-box .label {
                    display: block;
                    font-size: 0.75rem;
                    color: #aaa;
                    margin-bottom: 0.25rem;
                }

                .score-box .value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #00ff00;
                }

                .tapfrenzy-controls {
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
                    flex: 1;
                    min-width: 150px;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .balance-display {
                    text-align: center;
                    font-size: 1.25rem;
                    color: #00ff00;
                }

                .game-content {
                    display: flex;
                    gap: 2rem;
                }

                .tapfrenzy-sidebar {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 200px;
                    max-width: 250px;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .tapfrenzy-sidebar h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #aaa;
                }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .history-item {
                    background: rgba(0, 0, 0, 0.3);
                    border-left: 3px solid #00ff00;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .history-item.lost {
                    border-left-color: #ff0000;
                }

                .game-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }

                .game-info .score {
                    color: #aaa;
                }

                .game-info .multiplier {
                    color: #00ff00;
                }

                .history-item.lost .multiplier {
                    color: #ff0000;
                }

                .game-result {
                    color: #aaa;
                    font-size: 0.8rem;
                }

                .history-item.won .game-result {
                    color: #28a745;
                    font-weight: bold;
                }

                .history-item.lost .game-result {
                    color: #ff0000;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default TapFrenzy;
