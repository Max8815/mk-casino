import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const Dice = ({ user = {}, onLogout } = {}) => {
    const [balance, setBalance] = useState(user?.balance || 1000);
    const [betAmount, setBetAmount] = useState('10');
    const [gameState, setGameState] = useState('idle'); // idle, rolling, result
    const [diceValue, setDiceValue] = useState(null);
    const [playerGuess, setPlayerGuess] = useState(null);
    const [result, setResult] = useState(null); // 'win', 'lose'
    const [history, setHistory] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState(1);
    const [serverSeed, setServerSeed] = useState('');
    const [serverSeedHash, setServerSeedHash] = useState('');
    const [clientSeed, setClientSeed] = useState(() => generateRandomHex(8));
    const [nonce, setNonce] = useState(0);
    const [rolling, setRolling] = useState(false);

    const generateDiceValue = useCallback((hash) => {
        try {
            const hashStr = typeof hash === 'string' ? hash : JSON.stringify(hash);
            const uint = parseInt(hashStr.substring(0, 2), 16) || 0;
            return (uint % 6) + 1; // 1-6
        } catch {
            return Math.floor(Math.random() * 6) + 1;
        }
    }, []);

    // Memoized styles to avoid recreation on every render
    const styles = useMemo(() => ({
        appLayout: {
            display: 'flex',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
        },
        gameContainer: {
            flex: 1,
            padding: '2rem',
            overflow: 'auto',
        },
        gameContent: {
            display: 'flex',
            gap: '2rem',
            maxWidth: '1200px',
        },
        diceGame: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '2rem',
            flex: 1,
        },
        diceDisplay: {
            textAlign: 'center',
            marginBottom: '3rem',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        diceCube: {
            width: '200px',
            height: '200px',
            perspective: '1000px',
            marginBottom: '2rem',
        },
        diceFace: {
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
            border: '3px solid #333',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
            position: 'relative',
        },
        diceDots: {
            display: 'grid',
            gap: '10px',
            padding: '15px',
        },
        dot: {
            width: '20px',
            height: '20px',
            background: '#000',
            borderRadius: '50%',
        },
        diceNumber: {
            fontSize: '5rem',
            fontWeight: '900',
            color: '#333',
        },
        diceResult: {
            fontSize: '2rem',
            fontWeight: 'bold',
            marginTop: '1rem',
            color: '#ff0000',
        },
        diceResultWin: {
            color: '#00ff00',
        },
        numberSelector: {
            marginBottom: '2rem',
        },
        selectorLabel: {
            color: '#aaa',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        numberGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.75rem',
            marginBottom: '2rem',
        },
        numberBtn: {
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid #555',
            color: '#aaa',
            borderRadius: '6px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        numberBtnSelected: {
            background: 'rgba(0, 255, 0, 0.2)',
            borderColor: '#00ff00',
            color: '#00ff00',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
        },
        betSection: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
        },
        betInputGroup: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
        },
        betInputLabel: {
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            color: '#aaa',
        },
        betInput: {
            padding: '0.75rem',
            border: '1px solid #555',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '1rem',
            fontFamily: 'inherit',
        },
        btn: {
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        btnPrimary: {
            background: '#007bff',
            color: 'white',
            flex: 1,
        },
        resultSection: {
            textAlign: 'center',
            marginBottom: '2rem',
        },
        resultText: {
            color: '#aaa',
            marginBottom: '1.5rem',
            fontSize: '1.1rem',
        },
        balanceDisplay: {
            textAlign: 'center',
            fontSize: '1.25rem',
            color: '#00ff00',
        },
        diceSidebar: {
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1.5rem',
            minWidth: '220px',
            maxWidth: '280px',
            maxHeight: '600px',
            overflowY: 'auto',
        },
        historyList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
        },
        historyItem: {
            background: 'rgba(0, 0, 0, 0.3)',
            borderLeft: '3px solid #ff0000',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
        },
        historyItemWin: {
            borderLeftColor: '#00ff00',
        },
    }), []);

    const roll = useCallback(async () => {
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0 || amount > balance) {
            alert('Invalid bet amount');
            return;
        }

        if (!selectedNumber || selectedNumber < 1 || selectedNumber > 6) {
            alert('Select a number 1-6');
            return;
        }

        setBalance(prev => +(prev - amount).toFixed(2));
        setGameState('rolling');
        setRolling(true);

        // Generate new server seed PROPERLY with await
        const { serverSeed: newSeed, serverSeedHash: newHash } = await newServerSeed();
        setServerSeed(newSeed);
        setServerSeedHash(newHash);

        // Animate rolling for 1 second
        let frames = 0;
        const rollInterval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            frames++;
            if (frames > 10) {
                clearInterval(rollInterval);

                // Get actual result from hash
                const deriveActualValue = async () => {
                    const hash = await deriveHash(newSeed, clientSeed, nonce);
                    const actualValue = generateDiceValue(hash);
                    setDiceValue(actualValue);
                    setPlayerGuess(selectedNumber);

                    const isWin = actualValue === selectedNumber;
                    setResult(isWin ? 'win' : 'lose');

                    // Update balance
                    if (isWin) {
                        setBalance(prev => +(prev + amount * 6).toFixed(2));
                    }

                    // Add to history
                    setHistory(prev => [{
                        guess: selectedNumber,
                        result: actualValue,
                        isWin: isWin,
                        amount: amount,
                        payout: isWin ? amount * 6 : 0,
                        time: new Date().toLocaleTimeString(),
                    }, ...prev.slice(0, 19)]);

                    setGameState('result');
                    setRolling(false);
                };
                deriveActualValue();
            }
        }, 100);
    }, [betAmount, balance, selectedNumber, clientSeed, nonce, generateDiceValue]);

    const nextRound = useCallback(() => {
        setNonce(n => n + 1);
        setGameState('idle');
        setDiceValue(null);
        setPlayerGuess(null);
        setResult(null);
        setBetAmount('10');
    }, []);

    // Initialize server seed
    useEffect(() => {
        newServerSeed().then(({ serverSeed: s, serverSeedHash: h }) => {
            setServerSeed(s);
            setServerSeedHash(h);
        });
    }, []);

    const gridTemplateColumns = {
        1: 'repeat(1, 1fr)',
        2: 'repeat(2, 1fr)',
        3: 'repeat(3, 1fr)',
        4: 'repeat(4, 1fr)',
        5: 'repeat(5, 1fr)',
        6: 'repeat(6, 1fr)',
    };

    return (
        <div style={styles.appLayout}>
            <Header user={user} onLogout={onLogout} />
            <Sidebar />

            <main style={styles.gameContainer}>
                <h1>🎲 Dice Game</h1>
                <div style={styles.gameContent}>

                    <div style={styles.diceGame}>
                        {/* Dice Display */}
                        <div style={styles.diceDisplay}>
                            <div style={styles.diceCube}>
                                <div style={styles.diceFace}>
                                    {diceValue ? (
                                        <div style={{ ...styles.diceDots, gridTemplateColumns: gridTemplateColumns[diceValue] }}>
                                            {Array.from({ length: diceValue }).map((_, i) => (
                                                <div key={i} style={styles.dot}></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={styles.diceNumber}>?</div>
                                    )}
                                </div>
                            </div>
                            {diceValue && !rolling && (
                                <div style={{ ...styles.diceResult, ...(result === 'win' ? styles.diceResultWin : {}) }}>
                                    {result === 'win' ? '✓ WIN!' : '✗ LOSE'}
                                </div>
                            )}
                        </div>

                        {/* Number Selection */}
                        {gameState === 'idle' && (
                            <div style={styles.numberSelector}>
                                <div style={styles.selectorLabel}>Pick a number (1-6)</div>
                                <div style={styles.numberGrid}>
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <button
                                            key={num}
                                            style={{
                                                ...styles.numberBtn,
                                                ...(selectedNumber === num ? styles.numberBtnSelected : {}),
                                            }}
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
                            <div style={styles.betSection}>
                                <div style={styles.betInputGroup}>
                                    <label style={styles.betInputLabel}>Bet Amount</label>
                                    <input
                                        type="number"
                                        style={styles.betInput}
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(e.target.value)}
                                        min="1"
                                        max={balance}
                                        placeholder="Enter bet"
                                    />
                                </div>
                                <button
                                    style={{ ...styles.btn, ...styles.btnPrimary }}
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
                            <div style={styles.resultSection}>
                                <div style={styles.resultText}>
                                    {result === 'win' 
                                        ? `You guessed ${playerGuess}, got ${diceValue}! WIN!`
                                        : `You guessed ${playerGuess}, got ${diceValue}. Lose!`
                                    }
                                </div>
                                <button
                                    style={{ ...styles.btn, ...styles.btnPrimary }}
                                    onClick={nextRound}
                                >
                                    Next Round
                                </button>
                            </div>
                        )}

                        <div style={styles.balanceDisplay}>
                            Balance: {balance.toFixed(2)} USDT
                        </div>
                    </div>

                    {/* History */}
                    <div style={styles.diceSidebar}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#aaa' }}>Recent Rolls</h3>
                        <div style={styles.historyList}>
                            {history.length > 0 ? history.map((game, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        ...styles.historyItem,
                                        ...(game.isWin ? styles.historyItemWin : {}),
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                        <span style={{ color: '#aaa' }}>Guessed: {game.guess}</span>
                                        <span style={{ color: '#aaa' }}>Rolled: {game.result}</span>
                                    </div>
                                    <div style={{
                                        color: game.isWin ? '#00ff00' : '#ff0000',
                                        fontWeight: 'bold',
                                    }}>
                                        {game.isWin ? `+${game.payout.toFixed(2)}` : `-${game.amount.toFixed(2)}`}
                                    </div>
                                </div>
                            )) : <p style={{ color: '#aaa' }}>No rolls yet</p>}
                        </div>
                    </div>
                </div>

                {serverSeedHash && (
                    <ProvablyFairPanel
                        game="dice"
                        serverSeedHash={serverSeedHash}
                        clientSeed={clientSeed}
                        onClientSeedChange={setClientSeed}
                        nonce={nonce}
                    />
                )}
            </main>
        </div>
    );
};

export default Dice;
