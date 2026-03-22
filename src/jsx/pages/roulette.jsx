import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

// ─── ROULETTE CONSTANTS ───────────────────────────────────────
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
        default:
            // straight number bet
            return parseInt(betId) === n;
    }
};

const getPayout = (betId, betAmount) => {
    const found = BET_TYPES.find(b => b.id === betId);
    if (found) return betAmount * found.payout;
    // straight number = 36x
    return betAmount * 36;
};

// ─── DRAW WHEEL ON CANVAS ───────────────────────────────────────
const drawWheel = (canvas, rotation = 0) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR * 0.22;
    const segCount = WHEEL_ORDER.length;
    const segAngle = (2 * Math.PI) / segCount;

    ctx.clearRect(0, 0, size, size);

    // outer ring (dark)
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d17';
    ctx.fill();

    WHEEL_ORDER.forEach((num, i) => {
        const startAngle = rotation + i * segAngle - Math.PI / 2;
        const endAngle = startAngle + segAngle;
        const color = getColor(num);

        // fill segment
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = SEGMENT_COLORS[color];
        ctx.fill();

        // segment border
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // number text
        const midAngle = startAngle + segAngle / 2;
        const textR = outerR * 0.75;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, size * 0.032)}px Poppins, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
    });

    // inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d17';
    ctx.fill();
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // center emoji
    ctx.font = `${innerR * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎰', cx, cy);
};

// ─── ROULETTE PAGE ───────────────────────────────────────────────
const INITIAL_BALANCE = 1000;

const Roulette = () => {
    const canvasRef = useRef(null);
    const rotationRef = useRef(0);
    const rafRef = useRef(null);

    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [betAmount, setBetAmount] = useState('10');
    const [selectedBets, setSelectedBets] = useState([]); // [{id, amount}]
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null); // {number, color}
    const [lastResult, setLastResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [showDeposit, setShowDeposit] = useState(false);
    const [copied, setCopied] = useState(false);

    // total bet across all selected bets
    const totalBet = selectedBets.reduce((s, b) => s + b.amount, 0);

    // ── Draw initial wheel
    useEffect(() => {
        drawWheel(canvasRef.current, 0);
    }, []);

    // ── Animate spin
    const animateSpin = useCallback((targetRotation, onComplete) => {
        const startRot = rotationRef.current;
        const totalChange = targetRotation - startRot;
        const duration = 4000; // ms
        const startTime = performance.now();

        const ease = (t) => {
            // ease-out cubic
            return 1 - Math.pow(1 - t, 3);
        };

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
                onComplete();
            }
        };

        rafRef.current = requestAnimationFrame(frame);
    }, []);

    const handleSpin = () => {
        if (spinning) return;
        if (selectedBets.length === 0) return;
        if (totalBet > balance) return;

        setSpinning(true);
        setResult(null);

        // Deduct bet
        setBalance(prev => +(prev - totalBet).toFixed(2));

        // Pick random result
        const resultIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
        const resultNumber = WHEEL_ORDER[resultIndex];
        const resultColor = getColor(resultNumber);

        // Calculate target rotation so winning segment ends under pointer
        // Pointer is at top (-PI/2). segment i is at: rotation + i * segAngle - PI/2
        // We want segment resultIndex to be at 0 (top), so:
        // rotation + resultIndex * segAngle - PI/2 = -PI/2 + segAngle/2
        // => rotation = - resultIndex * segAngle + segAngle/2
        const segAngle = (2 * Math.PI) / WHEEL_ORDER.length;
        const targetBaseRot = -resultIndex * segAngle + segAngle / 2;

        // Add multiple full spins (5-8 rotations for drama)
        const fullSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        const targetRotation = targetBaseRot + fullSpins;

        animateSpin(targetRotation, () => {
            rotationRef.current = targetBaseRot; // normalize
            drawWheel(canvasRef.current, targetBaseRot);
            setSpinning(false);

            // Evaluate bets
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
        });
    };

    const toggleBet = (betId) => {
        if (spinning) return;
        const amount = parseFloat(betAmount) || 0;
        if (amount <= 0) return;

        setSelectedBets(prev => {
            const existing = prev.find(b => b.id === betId);
            if (existing) {
                return prev.filter(b => b.id !== betId);
            }
            return [...prev, { id: betId, amount }];
        });
    };

    const clearBets = () => {
        if (!spinning) setSelectedBets([]);
    };

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

                    {/* Page Title */}
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>
                                🎡 European Roulette
                            </h3>
                            <p className="text-muted fs-sm mb-0" style={{ marginTop: 4 }}>
                                Place your bets in USDT · Single Zero · European Rules
                            </p>
                        </div>
                        {lastResult && (
                            <div style={{ textAlign: 'center' }}>
                                <div className="text-muted fs-sm mb-0">Last Number</div>
                                <div className={`num-badge ${lastResult.color}`} style={{ width: 42, height: 42, fontSize: '1rem', margin: '4px auto 0' }}>
                                    {lastResult.number}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Balance</div>
                                <div className="stat-value usdt">{balance.toFixed(2)} USDT</div>
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
                                <div className="stat-label">Total P&L</div>
                                <div className={`stat-value ${parseFloat(stats.totalProfit) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(stats.totalProfit) >= 0 ? '+' : ''}{stats.totalProfit} USDT
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result Alert */}
                    {result && (
                        <div className={`result-alert ${result.net >= 0 ? 'win' : 'lose'}`}>
                            <span className="result-alert-icon">{result.net >= 0 ? '🏆' : '😔'}</span>
                            <div className="result-alert-text">
                                <h5>
                                    {result.net >= 0
                                        ? `You won ${result.totalWin.toFixed(2)} USDT!`
                                        : `No luck this time`}
                                </h5>
                                <p>
                                    Ball landed on <strong style={{ color: result.color === 'red' ? '#e74c3c' : result.color === 'green' ? '#2ecc71' : '#ccc' }}>
                                        {result.number}
                                    </strong> ({result.color}) &nbsp;·&nbsp;
                                    Net: {result.net >= 0 ? '+' : ''}{result.net.toFixed(2)} USDT
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Main Layout */}
                    <div className="row">
                        {/* LEFT: Wheel */}
                        <div className="col-xl-7">
                            <div className="card mb-4">
                                <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '32px 24px' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        {/* Pointer */}
                                        <div style={{
                                            position: 'absolute',
                                            top: -14,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 0, height: 0,
                                            borderLeft: '10px solid transparent',
                                            borderRight: '10px solid transparent',
                                            borderTop: '20px solid #c9a84c',
                                            zIndex: 10,
                                            filter: 'drop-shadow(0 0 6px #c9a84c)',
                                        }} />
                                        <canvas
                                            ref={canvasRef}
                                            width={320}
                                            height={320}
                                            className="roulette-canvas"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Number Grid */}
                            <div className="card">
                                <div className="card-header">
                                    <h4>Straight Number Bets <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 400 }}>· 36x payout</span></h4>
                                </div>
                                <div className="card-body">
                                    <div className="number-grid">
                                        {/* Zero */}
                                        <button
                                            className={`number-btn num-zero ${isBetSelected('0') ? 'selected' : ''}`}
                                            onClick={() => toggleBet('0')}
                                            disabled={spinning}
                                        >
                                            0
                                        </button>
                                        {/* 1–36 */}
                                        {Array.from({ length: 36 }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                className={`number-btn ${RED_NUMBERS.includes(n) ? 'num-red' : 'num-black'} ${isBetSelected(String(n)) ? 'selected' : ''}`}
                                                onClick={() => toggleBet(String(n))}
                                                disabled={spinning}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Betting Controls */}
                        <div className="col-xl-5">
                            {/* Outside Bets */}
                            <div className="card mb-3">
                                <div className="card-header"><h4>Outside Bets</h4></div>
                                <div className="card-body">
                                    <div className="bet-section-title">Color · Even/Odd · High/Low <span style={{ color: '#E8000F' }}>2x</span></div>
                                    <div className="bet-options-grid mb-3">
                                        <button className={`bet-btn red-btn ${isBetSelected('red') ? 'selected' : ''}`} onClick={() => toggleBet('red')} disabled={spinning}>🔴 Red</button>
                                        <button className={`bet-btn black-btn ${isBetSelected('black') ? 'selected' : ''}`} onClick={() => toggleBet('black')} disabled={spinning}>⚫ Black</button>
                                        <button className={`bet-btn ${isBetSelected('even') ? 'selected' : ''}`} onClick={() => toggleBet('even')} disabled={spinning}>Even</button>
                                        <button className={`bet-btn ${isBetSelected('odd') ? 'selected' : ''}`} onClick={() => toggleBet('odd')} disabled={spinning}>Odd</button>
                                        <button className={`bet-btn ${isBetSelected('1-18') ? 'selected' : ''}`} onClick={() => toggleBet('1-18')} disabled={spinning}>1–18</button>
                                        <button className={`bet-btn ${isBetSelected('19-36') ? 'selected' : ''}`} onClick={() => toggleBet('19-36')} disabled={spinning}>19–36</button>
                                    </div>

                                    <div className="bet-section-title">Dozens · Columns <span style={{ color: '#E8000F' }}>3x</span></div>
                                    <div className="bet-options-grid">
                                        {['dozen1','dozen2','dozen3','col1','col2','col3'].map(id => {
                                            const b = BET_TYPES.find(x => x.id === id);
                                            return (
                                                <button
                                                    key={id}
                                                    className={`bet-btn ${isBetSelected(id) ? 'selected' : ''}`}
                                                    onClick={() => toggleBet(id)}
                                                    disabled={spinning}
                                                >
                                                    {b.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Bet Amount */}
                            <div className="card mb-3">
                                <div className="card-header"><h4>Bet Amount (per selection)</h4></div>
                                <div className="card-body">
                                    <div className="amount-input-wrapper">
                                        <span className="amount-currency">USDT</span>
                                        <input
                                            type="number"
                                            className="amount-input"
                                            value={betAmount}
                                            min="1"
                                            step="1"
                                            onChange={e => setBetAmount(e.target.value)}
                                            disabled={spinning}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="quick-amounts">
                                        {[5, 10, 25, 50, 100].map(v => (
                                            <button key={v} className="quick-btn" onClick={() => setBetAmount(String(v))} disabled={spinning}>
                                                {v}
                                            </button>
                                        ))}
                                        <button
                                            className="quick-btn"
                                            onClick={() => setBetAmount(String(Math.floor(balance / 2)))}
                                            disabled={spinning}
                                            style={{ borderColor: 'var(--red)', color: '#E8000F' }}
                                        >
                                            ½ Balance
                                        </button>
                                    </div>

                                    {selectedBets.length > 0 && (
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-card2)', borderRadius: 10, fontSize: '0.82rem' }}>
                                            <div className="d-flex justify-content-between mb-0">
                                                <span className="text-muted">Selections:</span>
                                                <span>{selectedBets.length} bet{selectedBets.length > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Total stake:</span>
                                                <span style={{ color: 'var(--usdt)', fontWeight: 700 }}>{totalBet.toFixed(2)} USDT</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                className="spin-btn"
                                onClick={handleSpin}
                                disabled={spinning || selectedBets.length === 0 || totalBet > balance}
                            >
                                {spinning ? '⏳ Spinning...' : '🎰 Spin the Wheel'}
                            </button>

                            {totalBet > balance && (
                                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', textAlign: 'center', marginTop: 8 }}>
                                    Insufficient balance. Please deposit USDT.
                                </p>
                            )}

                            <button className="clear-btn" onClick={clearBets} disabled={spinning}>
                                Clear All Bets
                            </button>
                        </div>
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="card mt-4">
                            <div className="card-header">
                                <h4>Bet History</h4>
                                <span className="text-muted fs-sm">{history.length} rounds</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Number</th>
                                                <th>Bets Placed</th>
                                                <th>Stake</th>
                                                <th>Payout</th>
                                                <th>Net</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map(h => (
                                                <tr key={h.id}>
                                                    <td className="text-muted fs-sm">{h.time}</td>
                                                    <td>
                                                        <span className={`num-badge ${h.color}`}>
                                                            {h.number}
                                                        </span>
                                                    </td>
                                                    <td className="fs-sm">
                                                        {h.bets.map((b, i) => (
                                                            <span key={i} style={{
                                                                display: 'inline-block',
                                                                marginRight: 4,
                                                                padding: '2px 8px',
                                                                borderRadius: 6,
                                                                background: b.won ? 'rgba(52,195,143,0.1)' : 'rgba(244,106,106,0.08)',
                                                                border: `1px solid ${b.won ? 'var(--success)' : 'rgba(244,106,106,0.3)'}`,
                                                                color: b.won ? 'var(--success)' : 'var(--text-muted)',
                                                                fontSize: '0.73rem',
                                                                fontWeight: 600,
                                                            }}>
                                                                {b.id}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td className="text-muted fs-sm">{h.totalBet.toFixed(2)} USDT</td>
                                                    <td className="fs-sm" style={{ color: h.totalWin > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {h.totalWin.toFixed(2)} USDT
                                                    </td>
                                                    <td>
                                                        <span className={h.net >= 0 ? 'win-badge' : 'lose-badge'}>
                                                            {h.net >= 0 ? '+' : ''}{h.net.toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">💳 Deposit USDT (TRC-20)</h3>
                        <p className="text-muted fs-sm mb-3">Send USDT on the TRON network (TRC-20) to this address:</p>

                        <div className="deposit-address-box">
                            TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K
                        </div>

                        <button className="copy-btn" onClick={copyAddress}>
                            {copied ? '✅ Copied!' : '📋 Copy Address'}
                        </button>

                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 10,
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                        }}>
                            ⚠️ Only send <strong style={{ color: '#E8000F' }}>USDT TRC-20</strong> to this address.
                            Sending other tokens may result in permanent loss.
                            Minimum deposit: <strong>10 USDT</strong>.
                        </div>

                        {/* Demo add funds */}
                        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <p className="fs-sm text-muted mb-2">Demo mode — add funds instantly:</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[100, 500, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => { setBalance(prev => +(prev + v).toFixed(2)); setShowDeposit(false); }}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 8,
                                            border: '1px solid var(--usdt)',
                                            background: 'rgba(38,161,123,0.1)',
                                            color: 'var(--usdt)', fontWeight: 700,
                                            fontSize: '0.85rem', cursor: 'pointer',
                                            fontFamily: 'Poppins, sans-serif',
                                        }}
                                    >
                                        +{v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Roulette;
