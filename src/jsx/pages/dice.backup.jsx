import React, { useState, useCallback, useEffect } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const Dice = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, rolling, result
    const [diceValue, setDiceValue] = useState(null);
    const [playerGuess, setPlayerGuess] = useState(null);
    const [result, setResult] = useState(null); // 'win', 'lose'
    const [history, setHistory] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState(1);
    const [serverSeed, setServerSeed] = useState(null);
    const [clientSeed, setClientSeed] = useState(generateRandomHex());
    const [nonce, setNonce] = useState(0);
    const [rolling, setRolling] = useState(false);

    const generateDiceValue = useCallback((seed1, seed2, n) => {
        try {
            const hash = deriveHash(seed1, seed2, n);
            const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
            const uint = parseInt(hashStr.substring(0, 2), 16) || 0;
            return (uint % 6) + 1; // 1-6
        } catch {
            return Math.floor(Math.random() * 6) + 1;
        }
    }, []);

    const roll = useCallback(() => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        if (!selectedNumber || selectedNumber < 1 || selectedNumber > 6) {
            alert('Select a number 1-6');
            return;
        }

        setBalance(prev => prev - amount);
        setGameState('rolling');
        setRolling(true);

        const newSeed = newServerSeed();
        setServerSeed(newSeed);

        // Animate rolling for 1 second
        let frames = 0;
        const rollInterval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            frames++;
            if (frames > 10) {
                clearInterval(rollInterval);

                // Get actual result
                const actualValue = generateDiceValue(newSeed, clientSeed, nonce);
                setDiceValue(actualValue);
                setPlayerGuess(selectedNumber);

                const isWin = actualValue === selectedNumber;
                setResult(isWin ? 'win' : 'lose');

                // Update balance
                if (isWin) {
                    setBalance(prev => prev + amount * 6);
                }

                // Add to history
                setHistory(prev => [{
                    guess: selectedNumber,
                    result: actualValue,
                    isWin: isWin,
                    amount: amount,
                    payout: isWin ? amount * 6 : 0
                }, ...prev.slice(0, 19)]);

                setGameState('result');
                setRolling(false);
            }
        }, 100);
    }, [betAmount, balance, selectedNumber, clientSeed, nonce, generateDiceValue]);

    const nextRound = useCallback(() => {
        setNonce(n => n + 1);
        setClientSeed(generateRandomHex());
        setGameState('idle');
        setDiceValue(null);
        setPlayerGuess(null);
        setResult(null);
        setBetAmount('');
    }, []);

    return (
        <div className="app-layout">
            <Header user={user} onLogout={onLogout} />
            <Sidebar />

            <main className="game-container">
                <h1>Dice</h1>
                <div className="game-content">

                    <div className="dice-game">
                        {/* Dice Display */}
                        <div className="dice-display">
                            <div className={`dice-cube ${rolling ? 'rolling' : ''}`}>
                                <div className="dice-face">
                                    {diceValue ? (
                                        <div className="dice-dots" data-value={diceValue}>
                                            {Array.from({ length: diceValue }).map((_, i) => (
                                                <div key={i} className="dot"></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="dice-number">?</div>
                                    )}
                                </div>
                            </div>
                            {diceValue && !rolling && (
                                <div className={`dice-result ${result}`}>
                                    {result === 'win' ? '✓ WIN!' : '✗ LOSE'}
                                </div>
                            )}
                        </div>

                        {/* Number Selection */}
                        {gameState === 'idle' && (
                            <div className="number-selector">
                                <div className="selector-label">Pick a number (1-6)</div>
                                <div className="number-grid">
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <button
                                            key={num}
                                            className={`number-btn ${selectedNumber === num ? 'selected' : ''}`}
                                            onClick={() => setSelectedNumber(num)}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bet Input */}
                        {gameState === 'idle' && (
                            <div className="bet-section">
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
                                    onClick={roll}
                                    disabled={!betAmount || parseFloat(betAmount) <= 0 || !selectedNumber}
                                >
                                    ROLL DICE
                                </button>
                            </div>
                        )}

                        {gameState === 'rolling' && (
                            <div style={{ textAlign: 'center', color: '#aaa', marginTop: '2rem' }}>
                                Rolling...
                            </div>
                        )}

                        {gameState === 'result' && (
                            <div className="result-section">
                                <div className="result-text">
                                    {result === 'win' 
                                        ? `You guessed ${playerGuess}, got ${diceValue}! WIN!`
                                        : `You guessed ${playerGuess}, got ${diceValue}. Lose!`
                                    }
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={nextRound}
                                >
                                    Next Round
                                </button>
                            </div>
                        )}

                        <div className="balance-display">
                            Balance: ${balance.toFixed(2)}
                        </div>
                    </div>

                    {/* History */}
                    <div className="dice-sidebar">
                        <h3>Recent Rolls</h3>
                        <div className="history-list">
                            {history.length > 0 ? history.map((game, idx) => (
                                <div
                                    key={idx}
                                    className={`history-item ${game.isWin ? 'win' : 'lose'}`}
                                >
                                    <div className="roll-info">
                                        <span className="guess">Guessed: {game.guess}</span>
                                        <span className="result">Rolled: {game.result}</span>
                                    </div>
                                    <div className="payout">
                                        {game.isWin ? `+$${game.payout.toFixed(2)}` : `-$${game.amount.toFixed(2)}`}
                                    </div>
                                </div>
                            )) : <p>No rolls yet</p>}
                        </div>
                    </div>
                </div>

                <ProvablyFairPanel
                    serverSeed={serverSeed}
                    clientSeed={clientSeed}
                    nonce={nonce}
                    result={diceValue}
                />
            </main>

            <style>{`
                .dice-game {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 2rem;
                    flex: 1;
                }

                .dice-display {
                    text-align: center;
                    margin-bottom: 3rem;
                    min-height: 280px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .dice-cube {
                    width: 200px;
                    height: 200px;
                    perspective: 1000px;
                    margin-bottom: 2rem;
                }

                .dice-cube.rolling {
                    animation: roll-animation 0.1s infinite;
                }

                @keyframes roll-animation {
                    0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                    25% { transform: rotateX(180deg) rotateY(90deg); }
                    50% { transform: rotateX(360deg) rotateY(180deg); }
                    75% { transform: rotateX(180deg) rotateY(270deg); }
                    100% { transform: rotateX(0deg) rotateY(360deg) rotateZ(360deg); }
                }

                .dice-face {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
                    border: 3px solid #333;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
                    position: relative;
                }

                .dice-dots {
                    display: grid;
                    gap: 10px;
                    padding: 15px;
                }

                .dice-dots[data-value="1"] {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr;
                }

                .dice-dots[data-value="2"] {
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                }

                .dice-dots[data-value="3"],
                .dice-dots[data-value="4"],
                .dice-dots[data-value="5"],
                .dice-dots[data-value="6"] {
                    grid-template-columns: repeat(3, 1fr);
                }

                .dice-dots[data-value="1"] .dot:nth-child(1) {
                    grid-column: 1; grid-row: 1;
                }

                .dice-dots[data-value="2"] .dot:nth-child(1) {
                    grid-column: 1; grid-row: 1;
                }
                .dice-dots[data-value="2"] .dot:nth-child(2) {
                    grid-column: 2; grid-row: 2;
                }

                .dice-dots[data-value="3"] .dot:nth-child(1) {
                    grid-column: 1; grid-row: 1;
                }
                .dice-dots[data-value="3"] .dot:nth-child(2) {
                    grid-column: 2; grid-row: 2;
                }
                .dice-dots[data-value="3"] .dot:nth-child(3) {
                    grid-column: 3; grid-row: 3;
                }

                .dot {
                    width: 20px;
                    height: 20px;
                    background: #000;
                    border-radius: 50%;
                }

                .dice-number {
                    font-size: 5rem;
                    font-weight: 900;
                    color: #333;
                }

                .dice-result {
                    font-size: 2rem;
                    font-weight: bold;
                    margin-top: 1rem;
                    color: #ff0000;
                }

                .dice-result.win {
                    color: #00ff00;
                }

                .number-selector {
                    margin-bottom: 2rem;
                }

                .selector-label {
                    color: #aaa;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .number-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }

                .number-btn {
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 2px solid #555;
                    color: #aaa;
                    border-radius: 6px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .number-btn:hover {
                    border-color: #00ff00;
                    color: #00ff00;
                }

                .number-btn.selected {
                    background: rgba(0, 255, 0, 0.2);
                    border-color: #00ff00;
                    color: #00ff00;
                    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
                }

                .bet-section {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .bet-input-group {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
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

                .result-section {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .result-text {
                    color: #aaa;
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
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

                .dice-sidebar {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 220px;
                    max-width: 280px;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .dice-sidebar h3 {
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
                    border-left: 3px solid #ff0000;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .history-item.win {
                    border-left-color: #00ff00;
                }

                .roll-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }

                .roll-info .guess {
                    color: #aaa;
                }

                .roll-info .result {
                    color: #aaa;
                }

                .payout {
                    color: #ff0000;
                    font-weight: bold;
                }

                .history-item.win .payout {
                    color: #00ff00;
                }
            `}</style>
        </div>
    );
};

export default Dice;
