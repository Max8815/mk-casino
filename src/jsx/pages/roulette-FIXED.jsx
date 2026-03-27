import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, deriveRoulette, generateRandomHex } from '../../utils/provablyFair';

const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

const getColor = (n) => {
    if (n === 0) return 'green';
    if (RED_NUMBERS.includes(n)) return 'red';
    return 'black';
};

const SEGMENT_COLORS = {
    red: '#c0392b',
    black: '#1a1a2a',
    green: '#1a7a4a',
};

const BET_TYPES = [
    { id: 'red', label: 'Red', payout: 2, category: 'outside' },
    { id: 'black', label: 'Black', payout: 2, category: 'outside' },
    { id: 'even', label: 'Even', payout: 2, category: 'outside' },
    { id: 'odd', label: 'Odd', payout: 2, category: 'outside' },
    { id: '1-18', label: '1–18', payout: 2, category: 'outside' },
    { id: '19-36', label: '19–36', payout: 2, category: 'outside' },
    { id: 'dozen1', label: '1st 12', payout: 3, category: 'outside' },
    { id: 'dozen2', label: '2nd 12', payout: 3, category: 'outside' },
    { id: 'dozen3', label: '3rd 12', payout: 3, category: 'outside' },
    { id: 'col1', label: 'Col 1', payout: 3, category: 'column' },
    { id: 'col2', label: 'Col 2', payout: 3, category: 'column' },
    { id: 'col3', label: 'Col 3', payout: 3, category: 'column' },
];

const checkWin = (betId, result) => {
    const n = result;
    switch (betId) {
        case 'red': return RED_NUMBERS.includes(n);
        case 'black': return BLACK_NUMBERS.includes(n);
        case 'even': return n !== 0 && n % 2 === 0;
        case 'odd': return n % 2 !== 0;
        case '1-18': return n >= 1 && n <= 18;
        case '19-36': return n >= 19 && n <= 36;
        case 'dozen1': return n >= 1 && n <= 12;
        case 'dozen2': return n >= 13 && n <= 24;
        case 'dozen3': return n >= 25 && n <= 36;
        case 'col1': return n !== 0 && n % 3 === 1;
        case 'col2': return n !== 0 && n % 3 === 2;
        case 'col3': return n !== 0 && n % 3 === 0;
        default: return parseInt(betId) === n;
    }
};

const getPayout = (betId, betAmount) => {
    const found = BET_TYPES.find(b => b.id === betId);
    if (found) return betAmount * found.payout;
    return betAmount * 36;
};

const drawWheel = (canvas, rotation = 0) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = canvas.width;
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR * 0.22;
    const segCount = WHEEL_ORDER.length;
    const segAngle = (2 * Math.PI) / segCount;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d17';
    ctx.fill();

    WHEEL_ORDER.forEach((num, i) => {
        const startAngle = rotation + i * segAngle - Math.PI / 2;
        const endAngle = startAngle + segAngle;
        const color = getColor(num);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = SEGMENT_COLORS[color];
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        const midAngle = startAngle + segAngle / 2;
        const textR = outerR * 0.75;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, size * 0.032)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d17';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${innerR * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◉', cx, cy);
};

const INITIAL_BALANCE = 1000;

const Roulette = () => {
    const canvasRef = useRef(null);
    const rotationRef = useRef(0);
    const rafRef = useRef(null);

    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [betAmount, setBetAmount] = useState('10');
    const [selectedBets, setSelectedBets] = useState([]);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [showDeposit, setShowDeposit] = useState(false);
    const [copied, setCopied] = useState(false);

    // Provably fair state
    const [serverSeed, setServerSeed] = useState('');
    const [serverSeedHash, setServerSeedHash] = useState('');
    const [clientSeed, setClientSeed] = useState(() => generateRandomHex(8));
    const [nonce, setNonce] = useState(0);
    const [lastGame, setLastGame] = useState(null);

    // Generate initial server seed on mount
    useEffect(() => {
        newServerSeed().then(({ serverSeed: s, serverSeedHash: h }) => {
            setServerSeed(s);
            setServerSeedHash(h);
        });
    }, []);

    // Draw wheel on mount and cleanup RAF on unmount
    useEffect(() => {
        drawWheel(canvasRef.current, 0);
        
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, []);

    const totalBet = selectedBets.reduce((s, b) => s + b.amount, 0);

    const animateSpin = useCallback((targetRotation, onComplete) => {
        const startRot = rotationRef.current;
        const totalChange = targetRotation - startRot;
        const duration = 4000;
        const startTime = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);

        const frame = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = ease(progress);
            const currentRot = startRot + totalChange * eased;
            rotationRef.current = currentRot;
            drawWheel(canvasRef.current, currentRot);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(frame);
            } else {
                rafRef.current = null;
                onComplete();
            }
        };
        rafRef.current = requestAnimationFrame(frame);
    }, []);

    const handleSpin = async () => {
        if (spinning || selectedBets.length === 0 || totalBet > balance) return;
        setSpinning(true);
        setResult(null);
        setBalance(prev => +(prev - totalBet).toFixed(2));

        // Derive outcome from hash (provably fair)
        const hash = await deriveHash(serverSeed, clientSeed, nonce);
        const resultNumber = deriveRoulette(hash);   // 0–36
        const resultIndex = WHEEL_ORDER.indexOf(resultNumber);
        const resultColor = getColor(resultNumber);

        const segAngle = (2 * Math.PI) / WHEEL_ORDER.length;
        const targetBaseRot = -resultIndex * segAngle + segAngle / 2;
        const fullSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        const targetRotation = targetBaseRot + fullSpins;

        // Capture provably fair values for this round before async state changes
        const roundServerSeed = serverSeed;
        const roundClientSeed = clientSeed;
        const roundNonce = nonce;

        animateSpin(targetRotation, async () => {
            rotationRef.current = targetBaseRot;
            drawWheel(canvasRef.current, targetBaseRot);
            setSpinning(false);

            let totalWin = 0;
            const betResults = selectedBets.map(bet => {
                const won = checkWin(bet.id, resultNumber);
                const payout = won ? getPayout(bet.id, bet.amount) : 0;
                if (won) totalWin += payout;
                return { ...bet, won, payout };
            });

            const netResult = totalWin - totalBet;
            setBalance(prev => +(prev + totalWin).toFixed(2));

            const historyEntry = {
                id: Date.now(),
                number: resultNumber,
                color: resultColor,
                bets: betResults,
                totalBet,
                totalWin,
                net: netResult,
                time: new Date().toLocaleTimeString(),
            };

            setResult({ number: resultNumber, color: resultColor, totalWin, net: netResult });
            setLastResult({ number: resultNumber, color: resultColor });
            setHistory(prev => [historyEntry, ...prev].slice(0, 20));

            // Reveal server seed for this round, generate fresh one for next round
            setLastGame({
                serverSeed: roundServerSeed,
                clientSeed: roundClientSeed,
                nonce: roundNonce,
                outcome: resultNumber,
            });
            setNonce(n => n + 1);
            const { serverSeed: nextSeed, serverSeedHash: nextHash } = await newServerSeed();
            setServerSeed(nextSeed);
            setServerSeedHash(nextHash);
        });
    };

    const toggleBet = (betId) => {
        if (spinning) return;
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0) return;
        setSelectedBets(prev => {
            const existing = prev.find(b => b.id === betId);
            if (existing) return prev.filter(b => b.id !== betId);
            return [...prev, { id: betId, amount }];
        });
    };

    const clearBets = () => { if (!spinning) setSelectedBets([]); };

    const copyAddress = () => {
        navigator.clipboard.writeText('TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isBetSelected = (id) => selectedBets.some(b => b.id === id);

    const stats = history.length > 0 ? {
        wins: history.filter(h => h.net > 0).length,
        losses: history.filter(h => h.net <= 0).length,
        totalProfit: history.reduce((s, h) => s + h.net, 0).toFixed(2),
    } : null;

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} onDeposit={() => setShowDeposit(true)} />

            <div className="content-body">
                <div className="content-inner">

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem', color: 'var(--white)' }}>Roulette</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2, marginBottom: 0 }}>European · Single Zero</p>
                        </div>
                        {lastResult && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 2 }}>Last</div>
                                <span className={`num-badge ${lastResult.color}`} style={{ width: 36, height: 36, fontSize: '0.9rem' }}>{lastResult.number}</span>
                            </div>
                        )}
                    </div>

                    {stats && (
                        <div className="stats-grid" style={{ marginBottom: 16 }}>
                            <div className="stat-card">
                                <div className="stat-label">Balance</div>
                                <div className="stat-value usdt">{balance.toFixed(2)}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Wins</div>
                                <div className="stat-value positive">{stats.wins}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Losses</div>
                                <div className="stat-value negative">{stats.losses}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">P&L</div>
                                <div className={`stat-value ${parseFloat(stats.totalProfit) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(stats.totalProfit) >= 0 ? '+' : ''}{stats.totalProfit}
                                </div>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`result-alert ${result.net >= 0 ? 'win' : 'lose'}`}>
                            <span className="result-alert-icon">{result.net >= 0 ? '↑' : '↓'}</span>
                            <div className="result-alert-text">
                                <h5>{result.net >= 0 ? `Won ${result.totalWin.toFixed(2)} USDT` : 'No luck this time'}</h5>
                                <p>Ball landed <strong style={{ color: result.color === 'red' ? '#ff6b6b' : result.color === 'green' ? '#fff' : '#fff' }}>{result.number} ({result.color})</strong> · Net: {result.net >= 0 ? '+' : ''}{result.net.toFixed(2)} USDT</p>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-xl-7">
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '28px 20px' }}>
                                    <canvas ref={canvasRef} width={300} height={300} className="roulette-canvas" />
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><h4>Numbers <span style={{ color: 'var(--muted)', fontWeight: 400 }}>36x</span></h4></div>
                                <div className="card-body">
                                    <div className="number-grid">
                                        <button className={`number-btn num-zero ${isBetSelected('0') ? 'selected' : ''}`} onClick={() => toggleBet('0')} disabled={spinning}>0</button>
                                        {Array.from({ length: 36 }, (_, i) => i + 1).map(n => (
                                            <button key={n} className={`number-btn ${RED_NUMBERS.includes(n) ? 'num-red' : 'num-black'} ${isBetSelected(String(n)) ? 'selected' : ''}`} onClick={() => toggleBet(String(n))} disabled={spinning}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-5">
                            <div className="card" style={{ marginBottom: 12 }}>
                                <div className="card-header"><h4>Outside Bets</h4></div>
                                <div className="card-body">
                                    <div className="bet-section-title">Color · Even/Odd · Range <span style={{ color: 'var(--red)' }}>2x</span></div>
                                    <div className="bet-options-grid mb-3">
                                        <button className={`bet-btn red-btn ${isBetSelected('red') ? 'selected' : ''}`} onClick={() => toggleBet('red')} disabled={spinning}>Red</button>
                                        <button className={`bet-btn black-btn ${isBetSelected('black') ? 'selected' : ''}`} onClick={() => toggleBet('black')} disabled={spinning}>Black</button>
                                        <button className={`bet-btn ${isBetSelected('even') ? 'selected' : ''}`} onClick={() => toggleBet('even')} disabled={spinning}>Even</button>
                                        <button className={`bet-btn ${isBetSelected('odd') ? 'selected' : ''}`} onClick={() => toggleBet('odd')} disabled={spinning}>Odd</button>
                                        <button className={`bet-btn ${isBetSelected('1-18') ? 'selected' : ''}`} onClick={() => toggleBet('1-18')} disabled={spinning}>1–18</button>
                                        <button className={`bet-btn ${isBetSelected('19-36') ? 'selected' : ''}`} onClick={() => toggleBet('19-36')} disabled={spinning}>19–36</button>
                                    </div>
                                    <div className="bet-section-title">Dozens · Columns <span style={{ color: 'var(--red)' }}>3x</span></div>
                                    <div className="bet-options-grid">
                                        {['dozen1','dozen2','dozen3','col1','col2','col3'].map(id => {
                                            const b = BET_TYPES.find(x => x.id === id);
                                            return <button key={id} className={`bet-btn ${isBetSelected(id) ? 'selected' : ''}`} onClick={() => toggleBet(id)} disabled={spinning}>{b.label}</button>;
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ marginBottom: 12 }}>
                                <div className="card-header"><h4>Bet Amount</h4></div>
                                <div className="card-body">
                                    <div className="amount-input-wrapper">
                                        <span className="amount-currency">USDT</span>
                                        <input type="number" className="amount-input" value={betAmount} min="1" step="1" onChange={e => setBetAmount(e.target.value)} disabled={spinning} placeholder="0.00" />
                                    </div>
                                    <div className="quick-amounts">
                                        {[5, 10, 25, 50, 100].map(v => (
                                            <button key={v} className="quick-btn" onClick={() => setBetAmount(String(v))} disabled={spinning}>{v}</button>
                                        ))}
                                    </div>
                                    {selectedBets.length > 0 && (
                                        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--card2)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className="text-muted">Selections:</span>
                                                <span>{selectedBets.length}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                <span className="text-muted">Total stake:</span>
                                                <span style={{ color: 'var(--white)', fontWeight: 700 }}>{totalBet.toFixed(2)} USDT</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button className="spin-btn" onClick={handleSpin} disabled={spinning || selectedBets.length === 0 || totalBet > balance}>
                                {spinning ? 'Spinning...' : 'Spin'}
                            </button>
                            {totalBet > balance && <p style={{ color: 'var(--red)', fontSize: '0.75rem', textAlign: 'center', marginTop: 6 }}>Insufficient balance.</p>}
                            <button className="clear-btn" onClick={clearBets} disabled={spinning}>Clear Bets</button>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <div className="card mt-4">
                            <div className="card-header">
                                <h4>History</h4>
                                <span className="text-muted fs-sm">{history.length} rounds</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Number</th>
                                            <th>Bets</th>
                                            <th>Stake</th>
                                            <th>Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td className="text-muted fs-sm">{h.time}</td>
                                                <td><span className={`num-badge ${h.color}`}>{h.number}</span></td>
                                                <td className="fs-sm">{h.bets.map((b, i) => <span key={i} style={{ marginRight: 4, padding: '2px 7px', borderRadius: 4, background: b.won ? 'rgba(232,0,15,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${b.won ? 'rgba(232,0,15,0.2)' : 'var(--border)'}`, color: b.won ? 'var(--white)' : 'var(--muted)', fontSize: '0.72rem', fontWeight: 600 }}>{b.id}</span>)}</td>
                                                <td className="text-muted fs-sm">{h.totalBet.toFixed(2)}</td>
                                                <td><span className={h.net >= 0 ? 'win-badge' : 'lose-badge'}>{h.net >= 0 ? '+' : ''}{h.net.toFixed(2)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <ProvablyFairPanel
                        game="roulette"
                        serverSeedHash={serverSeedHash}
                        clientSeed={clientSeed}
                        onClientSeedChange={setClientSeed}
                        nonce={nonce}
                        lastGame={lastGame}
                    />
                </div>
            </div>

            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">Deposit USDT</h3>
                        <div className="deposit-address-box">TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K</div>
                        <button className="copy-btn" onClick={copyAddress}>{copied ? 'Copied!' : 'Copy Address'}</button>
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            {[100, 500, 1000].map(v => (
                                <button key={v} onClick={() => { setBalance(prev => +(prev + v).toFixed(2)); setShowDeposit(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'var(--white)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font)' }}>+{v}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Roulette;
