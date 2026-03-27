import React, { useState, useCallback, useEffect } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const HiLo = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, showing_current, waiting_guess, result
    const [currentNumber, setCurrentNumber] = useState(null);
    const [nextNumber, setNextNumber] = useState(null);
    const [playerGuess, setPlayerGuess] = useState(null); // 'hi' or 'lo'
    const [result, setResult] = useState(null); // 'win', 'lose', 'tie'
    const [history, setHistory] = useState([]);
    const [serverSeed, setServerSeed] = useState(null);
    const [clientSeed, setClientSeed] = useState(generateRandomHex());
    const [nonce, setNonce] = useState(0);
    const [chainCount, setChainCount] = useState(0); // consecutive wins

    const generateNumber = useCallback(async (seed1, seed2, n) => {
        try {
            const hash = await deriveHash(seed1, seed2, n);
            let hashStr = typeof hash === 'string' ? hash : (hash && hash.toString ? hash.toString() : JSON.stringify(hash));
            // Extract hex digits
            const hexMatch = hashStr.match(/[0-9a-fA-F]+/);
            const hexStr = hexMatch ? hexMatch[0].substring(0, 8) : '00000000';
            const uint = parseInt(hexStr, 16) || Math.floor(Math.random() * 1000000);
            return (uint % 100) + 1; // 1-100
        } catch {
            return Math.floor(Math.random() * 100) + 1;
        }
    }, []);

    // Start game - show initial number
    const startGame = useCallback(async () => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        const newSeed = await newServerSeed();
        setServerSeed(newSeed);
        
        const current = await generateNumber(newSeed.serverSeed, clientSeed, nonce * 2);
        setCurrentNumber(current);
        setGameState('waiting_guess');
        setPlayerGuess(null);
        setResult(null);
        setNextNumber(null);
    }, [betAmount, balance, clientSeed, nonce, generateNumber]);

    // Make guess (Hi or Lo)
    const makeGuess = useCallback(async (guess) => {
        if (gameState !== 'waiting_guess') return;

        setPlayerGuess(guess);
        setGameState('showing_current');

        // Generate next number
        setTimeout(async () => {
            const next = await generateNumber(serverSeed.serverSeed, clientSeed, nonce * 2 + 1);
            setNextNumber(next);

            // Determine result
            let resultStr;
            if (next === currentNumber) {
                resultStr = 'tie';
            } else if (guess === 'hi' && next > currentNumber) {
                resultStr = 'win';
            } else if (guess === 'lo' && next < currentNumber) {
                resultStr = 'win';
            } else {
                resultStr = 'lose';
            }

            setResult(resultStr);

            // Update balance
            const amount = parseFloat(betAmount) || 0;
            if (resultStr === 'win') {
                setBalance(prev => prev + amount);
                setChainCount(c => c + 1);
            } else if (resultStr === 'lose') {
                setBalance(prev => prev - amount);
                setChainCount(0);
            }
            // tie = no change

            // Add to history
            setHistory(prev => [{
                current: currentNumber,
                next: next,
                guess: guess,
                result: resultStr,
                amount: amount,
                chain: resultStr === 'win' ? chainCount + 1 : 0
            }, ...prev.slice(0, 19)]);

            setGameState('result');
        }, 500);
    }, [gameState, currentNumber, serverSeed, clientSeed, nonce, betAmount, chainCount, generateNumber]);

    // Next round
    const nextRound = useCallback(() => {
        setNonce(n => n + 1);
        setClientSeed(generateRandomHex());
        startGame();
    }, [startGame]);

    return (
        <div className="app-layout">
            <Header user={user} onLogout={onLogout} />
            <Sidebar />

            <main className="game-container">
                <h1>Hi-Lo</h1>
                <div className="game-content">

                    <div className="hilo-game">
                        {/* Number Display Area */}
                        <div className="hilo-display">
                            <div className="number-section">
                                <div className="label">Current Number</div>
                                <div className={`big-number ${gameState === 'result' ? 'revealed' : ''}`}>
                                    {currentNumber || '-'}
                                </div>
                            </div>

                            {gameState === 'showing_current' && (
                                <div className="arrow">↓</div>
                            )}

                            {gameState === 'showing_current' && nextNumber && (
                                <div className="number-section next">
                                    <div className="label">Next Number</div>
                                    <div className={`big-number ${result ? `result-${result}` : ''}`}>
                                        {nextNumber}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Result Message */}
                        {gameState === 'result' && (
                            <div className={`result-message ${result}`}>
                                {result === 'win' && `✓ WIN! You guessed ${playerGuess.toUpperCase()} correctly!`}
                                {result === 'lose' && `✗ LOSE! You guessed wrong.`}
                                {result === 'tie' && `= TIE! Same number.`}
                                {chainCount > 0 && <div className="chain">Win Streak: {chainCount}</div>}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="hilo-controls">
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
                                        Start Game
                                    </button>
                                </>
                            )}

                            {gameState === 'waiting_guess' && (
                                <div className="guess-buttons">
                                    <button
                                        className="btn btn-hi"
                                        onClick={() => makeGuess('hi')}
                                    >
                                        HIGHER
                                    </button>
                                    <button
                                        className="btn btn-lo"
                                        onClick={() => makeGuess('lo')}
                                    >
                                        LOWER
                                    </button>
                                </div>
                            )}

                            {gameState === 'result' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={nextRound}
                                >
                                    Next Round
                                </button>
                            )}
                        </div>

                        <div className="balance-display">
                            Balance: ${balance.toFixed(2)}
                        </div>
                    </div>

                    {/* Sidebar - History */}
                    <div className="hilo-sidebar">
                        <h3>Recent Games</h3>
                        <div className="history-list">
                            {history.length > 0 ? history.map((game, idx) => (
                                <div
                                    key={idx}
                                    className={`history-item ${game.result}`}
                                >
                                    <div className="game-numbers">
                                        <span className="number">{game.current}</span>
                                        <span className="guess">{game.guess === 'hi' ? '↑' : '↓'}</span>
                                        <span className="number">{game.next}</span>
                                    </div>
                                    <div className="game-result">
                                        {game.result === 'win' && `+$${game.amount.toFixed(2)}`}
                                        {game.result === 'lose' && `-$${game.amount.toFixed(2)}`}
                                        {game.result === 'tie' && 'TIE'}
                                    </div>
                                    {game.chain > 0 && <div className="chain-badge">×{game.chain}</div>}
                                </div>
                            )) : <p>No games yet</p>}
                        </div>
                    </div>
                </div>

                <ProvablyFairPanel
                    serverSeed={serverSeed}
                    clientSeed={clientSeed}
                    nonce={nonce}
                    result={nextNumber}
                />
            </main>

            <style>{`
                .hilo-game {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 2.5rem;
                    flex: 1;
                }

                .hilo-display {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 2.5rem;
                    min-height: 250px;
                    justify-content: center;
                }

                .number-section {
                    text-align: center;
                }

                .number-section .label {
                    font-size: 0.875rem;
                    color: #aaa;
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .big-number {
                    font-size: 5rem;
                    font-weight: 900;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
                    line-height: 1;
                    transition: all 0.3s ease;
                }

                .big-number.result-win {
                    color: #28a745;
                    text-shadow: 0 0 20px rgba(40, 167, 69, 0.7);
                }

                .big-number.result-lose {
                    color: #ff0000;
                    text-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
                }

                .big-number.result-tie {
                    color: #ffc107;
                    text-shadow: 0 0 20px rgba(255, 193, 7, 0.7);
                }

                .number-section.next {
                    margin-top: 2rem;
                }

                .arrow {
                    font-size: 2rem;
                    color: #00ff00;
                    margin: 1rem 0;
                    animation: pulse 0.5s ease-in-out;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .result-message {
                    background: rgba(0, 255, 0, 0.1);
                    border: 2px solid rgba(0, 255, 0, 0.5);
                    padding: 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 1.25rem;
                    color: #00ff00;
                    margin-bottom: 2rem;
                }

                .result-message.lose {
                    background: rgba(255, 0, 0, 0.1);
                    border-color: rgba(255, 0, 0, 0.5);
                    color: #ff0000;
                }

                .result-message.tie {
                    background: rgba(255, 193, 7, 0.1);
                    border-color: rgba(255, 193, 7, 0.5);
                    color: #ffc107;
                }

                .chain {
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    opacity: 0.8;
                }

                .hilo-controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
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

                .guess-buttons {
                    display: flex;
                    gap: 1rem;
                    width: 100%;
                }

                .btn {
                    padding: 1rem 2rem;
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
                    flex: 1;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
                }

                .btn-hi {
                    background: #28a745;
                    color: white;
                    flex: 1;
                    font-size: 1.1rem;
                }

                .btn-hi:hover {
                    background: #1e7e34;
                }

                .btn-lo {
                    background: #dc3545;
                    color: white;
                    flex: 1;
                    font-size: 1.1rem;
                }

                .btn-lo:hover {
                    background: #c82333;
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

                .hilo-sidebar {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 220px;
                    max-width: 280px;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .hilo-sidebar h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #aaa;
                }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .history-item {
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 3px solid #00ff00;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .history-item.lose {
                    border-left-color: #ff0000;
                }

                .history-item.tie {
                    border-left-color: #ffc107;
                }

                .game-numbers {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }

                .game-numbers .number {
                    background: rgba(0, 255, 0, 0.1);
                    padding: 0.25rem 0.5rem;
                    border-radius: 3px;
                    color: #00ff00;
                }

                .game-numbers .guess {
                    color: #aaa;
                    font-size: 1.1rem;
                }

                .game-result {
                    color: #aaa;
                    font-size: 0.8rem;
                }

                .history-item.win .game-result {
                    color: #28a745;
                    font-weight: bold;
                }

                .history-item.lose .game-result {
                    color: #ff0000;
                    font-weight: bold;
                }

                .chain-badge {
                    font-size: 0.75rem;
                    background: rgba(0, 255, 0, 0.2);
                    color: #00ff00;
                    padding: 0.25rem 0.5rem;
                    border-radius: 2px;
                    margin-top: 0.25rem;
                    display: inline-block;
                }
            `}</style>
        </div>
    );
};

export default HiLo;
