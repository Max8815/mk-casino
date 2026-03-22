import React, { useState, useRef, useCallback } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

// ─── SYMBOLS ─────────────────────────────────────────────────────
const SYMBOLS = [
    { id: 'kiss',    emoji: '💋', label: 'Kiss',       payout3: 100, payout2: 8,  weight: 2  },
    { id: 'bikini',  emoji: '👙', label: 'Bikini',     payout3: 50,  payout2: 5,  weight: 3  },
    { id: 'thong',   emoji: '🩱', label: 'Swimsuit',   payout3: 25,  payout2: 3,  weight: 5  },
    { id: 'heel',    emoji: '👠', label: 'High Heel',  payout3: 15,  payout2: 2,  weight: 7  },
    { id: 'lipstick',emoji: '💄', label: 'Lipstick',   payout3: 8,   payout2: 1,  weight: 9  },
    { id: 'rose',    emoji: '🌹', label: 'Rose',       payout3: 5,   payout2: 0,  weight: 11 },
    { id: 'cherry',  emoji: '🍒', label: 'Cherry',     payout3: 3,   payout2: 0,  weight: 13 },
    { id: 'fire',    emoji: '🔥', label: 'Fire',       payout3: 1.5, payout2: 0,  weight: 14 },
];

const POOL = SYMBOLS.flatMap(s => Array(s.weight).fill(s));
const randomSymbol = () => POOL[Math.floor(Math.random() * POOL.length)];
const makeStrip = (n = 30) => Array.from({ length: n }, randomSymbol);

const REEL_COUNT   = 3;
const VISIBLE_ROWS = 3;
const SYMBOL_HEIGHT = 90;
const PAYLINE_INDEX = 1;

// ─── WIN EVALUATION ──────────────────────────────────────────────
const evaluate = (results, betAmount) => {
    const [a, b, c] = results;
    let winnings = 0;
    let lines = [];

    if (a.id === b.id && b.id === c.id) {
        winnings = betAmount * a.payout3;
        lines.push({ type: '3 of a kind', symbol: a, payout: a.payout3 });
    } else if (a.id === b.id && a.payout2 > 0) {
        winnings = betAmount * a.payout2;
        lines.push({ type: '2 of a kind (left)', symbol: a, payout: a.payout2 });
    } else if (b.id === c.id && b.payout2 > 0) {
        winnings = betAmount * b.payout2;
        lines.push({ type: '2 of a kind (right)', symbol: b, payout: b.payout2 });
    }

    return { winnings: +winnings.toFixed(2), lines };
};

// ─── REEL COMPONENT ──────────────────────────────────────────────
const Reel = ({ strip, targetIndex, spinning, delay, onDone }) => {
    const reelRef = useRef(null);
    const animRef = useRef(null);

    React.useEffect(() => {
        if (!spinning) return;
        const el = reelRef.current;
        if (!el) return;

        const fullStrip   = SYMBOL_HEIGHT * strip.length;
        const targetOffset = targetIndex * SYMBOL_HEIGHT;
        const spinDistance = fullStrip * 5 + targetOffset;
        const duration    = 2000 + delay;

        let startTime  = null;
        let startScroll = el.scrollTop % fullStrip;

        const ease = t => t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const frame = ts => {
            if (!startTime) startTime = ts;
            const elapsed  = ts - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.scrollTop   = startScroll + spinDistance * ease(progress);

            if (progress < 1) {
                animRef.current = requestAnimationFrame(frame);
            } else {
                el.scrollTop = targetOffset;
                if (onDone) onDone();
            }
        };

        animRef.current = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(animRef.current);
    }, [spinning, targetIndex, delay, strip, onDone]);

    return (
        <div style={{
            width: SYMBOL_HEIGHT + 20,
            height: SYMBOL_HEIGHT * VISIBLE_ROWS,
            overflow: 'hidden',
            position: 'relative',
            borderRadius: 14,
            background: 'linear-gradient(180deg, #0d0000 0%, #1a0000 100%)',
            border: '2px solid rgba(200,15,35,0.6)',
            boxShadow: '0 0 20px rgba(200,15,35,0.15)',
        }}>
            {/* Payline highlight */}
            <div style={{
                position: 'absolute',
                top: SYMBOL_HEIGHT * PAYLINE_INDEX,
                left: 0, right: 0,
                height: SYMBOL_HEIGHT,
                background: 'rgba(200,15,35,0.08)',
                borderTop: '2px solid rgba(200,15,35,0.6)',
                borderBottom: '2px solid rgba(200,15,35,0.6)',
                zIndex: 2,
                pointerEvents: 'none',
            }} />

            {/* Scrollable strip */}
            <div
                ref={reelRef}
                style={{
                    height: '100%',
                    overflowY: 'scroll',
                    scrollbarWidth: 'none',
                }}
            >
                {[...strip, ...strip, ...strip].map((sym, i) => (
                    <div
                        key={i}
                        style={{
                            height: SYMBOL_HEIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.8rem',
                            userSelect: 'none',
                        }}
                    >
                        {sym.emoji}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── EROTIC SLOTS PAGE ────────────────────────────────────────────
const INITIAL_BALANCE = 1000;

const EroticSlots = () => {
    const [balance, setBalance]       = useState(INITIAL_BALANCE);
    const [betAmount, setBetAmount]   = useState('10');
    const [spinning, setSpinning]     = useState(false);
    const [strips]                    = useState(() => Array.from({ length: REEL_COUNT }, () => makeStrip(30)));
    const [targets, setTargets]       = useState([0, 0, 0]);
    const [results, setResults]       = useState(null);
    const [lastWin, setLastWin]       = useState(null);
    const [history, setHistory]       = useState([]);
    const [showDeposit, setShowDeposit] = useState(false);
    const [copied, setCopied]         = useState(false);
    const doneCount = useRef(0);

    const bet = parseFloat(betAmount) || 0;

    const handleSpin = useCallback(() => {
        if (spinning || bet <= 0 || bet > balance) return;

        setSpinning(true);
        setResults(null);
        setLastWin(null);
        setBalance(prev => +(prev - bet).toFixed(2));
        doneCount.current = 0;

        const newTargets = strips.map(strip =>
            Math.floor(Math.random() * strip.length)
        );
        setTargets(newTargets);

        const paylineSymbols = newTargets.map((idx, r) => strips[r][idx]);

        const onAllDone = () => {
            const { winnings, lines } = evaluate(paylineSymbols, bet);
            setBalance(prev => +(prev + winnings).toFixed(2));
            setResults(paylineSymbols);
            setLastWin({ winnings, lines, bet });
            setHistory(prev => [{
                id: Date.now(),
                symbols: paylineSymbols,
                bet,
                winnings,
                net: +(winnings - bet).toFixed(2),
                time: new Date().toLocaleTimeString(),
            }, ...prev].slice(0, 20));
            setSpinning(false);
        };

        const maxDuration = 2000 + (REEL_COUNT - 1) * 400 + 300;
        setTimeout(onAllDone, maxDuration);
    }, [spinning, bet, balance, strips]);

    const copyAddress = () => {
        navigator.clipboard.writeText('YOUR_USDT_WALLET_ADDRESS');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const stats = history.length > 0 ? {
        wins: history.filter(h => h.net > 0).length,
        total: history.length,
        profit: history.reduce((s, h) => s + h.net, 0).toFixed(2),
    } : null;

    const isJackpot = lastWin?.lines?.some(l => l.symbol.id === 'kiss' && l.type.includes('3'));

    // Red accent colour used throughout
    const pink = '#CC1122';
    const pinkFaint = 'rgba(200,15,35,';

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} onDeposit={() => setShowDeposit(true)} />

            <div className="content-body">
                <div className="content-inner">

                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>
                                💋 Erotic Slots
                            </h3>
                            <p className="text-muted fs-sm mb-0" style={{ marginTop: 4 }}>
                                Bet with USDT · Match symbols on the payline · Up to 100x
                            </p>
                        </div>
                        <span style={{
                            padding: '4px 14px', borderRadius: 20,
                            background: `${pinkFaint}0.12)`,
                            border: `1px solid ${pinkFaint}0.4)`,
                            color: pink, fontSize: '0.72rem', fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                            🔞 18+
                        </span>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Balance</div>
                                <div className="stat-value usdt">{balance.toFixed(2)} USDT</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Spins</div>
                                <div className="stat-value">{stats.total}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Wins</div>
                                <div className="stat-value positive">{stats.wins}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Total P&amp;L</div>
                                <div className={`stat-value ${parseFloat(stats.profit) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(stats.profit) >= 0 ? '+' : ''}{stats.profit} USDT
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jackpot Banner */}
                    {isJackpot && (
                        <div style={{
                            background: `linear-gradient(135deg, ${pinkFaint}0.2), ${pinkFaint}0.05))`,
                            border: `1px solid ${pink}`,
                            borderRadius: 14, padding: '18px 24px',
                            textAlign: 'center', marginBottom: 20,
                            animation: 'slideIn 0.4s ease',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: 6 }}>💋 JACKPOT! 💋</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pink }}>
                                +{lastWin.winnings.toFixed(2)} USDT
                            </div>
                            <div className="text-muted fs-sm">Three Kisses! 100x payout!</div>
                        </div>
                    )}

                    {/* Win/Lose alert */}
                    {lastWin && !isJackpot && (
                        <div className={`result-alert ${lastWin.winnings > 0 ? 'win' : 'lose'}`}>
                            <span className="result-alert-icon">{lastWin.winnings > 0 ? '💋' : '😔'}</span>
                            <div className="result-alert-text">
                                <h5>
                                    {lastWin.winnings > 0
                                        ? `Won ${lastWin.winnings.toFixed(2)} USDT!`
                                        : 'No match this time'}
                                </h5>
                                <p>
                                    {lastWin.lines.length > 0
                                        ? lastWin.lines.map(l => `${l.type} · ${l.payout}x`).join(' · ')
                                        : 'Spin again — luck is warming up!'}
                                    &nbsp;· Net: {(lastWin.winnings - lastWin.bet) >= 0 ? '+' : ''}{(lastWin.winnings - lastWin.bet).toFixed(2)} USDT
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {/* LEFT: Machine */}
                        <div className="col-xl-7">
                            <div className="card mb-4">
                                <div className="card-body" style={{ padding: '32px 24px' }}>

                                    {/* Machine frame */}
                                    <div style={{
                                        background: 'linear-gradient(180deg, #0a0000 0%, #120000 100%)',
                                        border: `2px solid ${pinkFaint}0.55)`,
                                        borderRadius: 20,
                                        padding: '28px 24px',
                                        boxShadow: `0 0 40px ${pinkFaint}0.18), inset 0 0 40px rgba(0,0,0,0.7)`,
                                    }}>
                                        {/* Machine top */}
                                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                            <div style={{
                                                fontSize: '1rem', fontWeight: 700,
                                                color: pink,
                                                letterSpacing: '0.15em', textTransform: 'uppercase',
                                            }}>
                                                💋 &nbsp;MK Erotic Slots&nbsp; 💋
                                            </div>
                                        </div>

                                        {/* Reels */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: 12,
                                            marginBottom: 24,
                                        }}>
                                            {strips.map((strip, i) => (
                                                <Reel
                                                    key={i}
                                                    strip={strip}
                                                    targetIndex={targets[i]}
                                                    spinning={spinning}
                                                    delay={i * 400}
                                                />
                                            ))}
                                        </div>

                                        {/* Payline label */}
                                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 16px', borderRadius: 20,
                                                background: `${pinkFaint}0.1)`,
                                                border: `1px solid ${pinkFaint}0.35)`,
                                                color: pink,
                                                fontSize: '0.72rem', fontWeight: 700,
                                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                            }}>
                                                — Payline —
                                            </span>
                                        </div>

                                        {/* Spin button */}
                                        <button
                                            onClick={handleSpin}
                                            disabled={spinning || bet <= 0 || bet > balance}
                                            style={{
                                                display: 'block', width: '100%',
                                                padding: '15px 0',
                                                borderRadius: 12, border: 'none',
                                                background: spinning || bet <= 0 || bet > balance
                                                    ? 'rgba(220,80,120,0.25)'
                                                    : `linear-gradient(135deg, ${pink}, #b03060)`,
                                                color: '#fff',
                                                fontSize: '1.1rem', fontWeight: 800,
                                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                                cursor: spinning || bet <= 0 || bet > balance ? 'not-allowed' : 'pointer',
                                                fontFamily: 'Poppins, sans-serif',
                                                transition: 'all 0.2s',
                                                boxShadow: spinning ? 'none' : `0 4px 20px ${pinkFaint}0.4)`,
                                            }}
                                        >
                                            {spinning ? '💋 Spinning...' : '💋 SPIN'}
                                        </button>

                                        {bet > balance && (
                                            <p style={{ color: 'var(--danger)', fontSize: '0.78rem', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
                                                Insufficient balance.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Paytable */}
                            <div className="card">
                                <div className="card-header"><h4>Paytable</h4></div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Symbol</th>
                                                <th>Name</th>
                                                <th>3 of a Kind</th>
                                                <th>2 of a Kind</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SYMBOLS.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontSize: '1.4rem' }}>{s.emoji}</td>
                                                    <td className="fs-sm">{s.label}</td>
                                                    <td>
                                                        <span style={{ color: pink, fontWeight: 700 }}>
                                                            {s.payout3}x
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {s.payout2 > 0
                                                            ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{s.payout2}x</span>
                                                            : <span className="text-muted">—</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Controls */}
                        <div className="col-xl-5">
                            <div className="card mb-3">
                                <div className="card-header"><h4>Bet Amount</h4></div>
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
                                        {[1, 5, 10, 25, 50, 100].map(v => (
                                            <button key={v} className="quick-btn" onClick={() => setBetAmount(String(v))} disabled={spinning}>
                                                {v}
                                            </button>
                                        ))}
                                        <button
                                            className="quick-btn"
                                            onClick={() => setBetAmount(String(Math.floor(balance / 2)))}
                                            disabled={spinning}
                                            style={{ borderColor: pink, color: pink }}
                                        >
                                            ½
                                        </button>
                                    </div>

                                    <div style={{
                                        marginTop: 14, padding: '10px 14px',
                                        background: 'var(--bg-card2)',
                                        borderRadius: 10, fontSize: '0.82rem',
                                    }}>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Bet per spin:</span>
                                            <span style={{ color: 'var(--usdt)', fontWeight: 700 }}>{bet.toFixed(2)} USDT</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Max win (100x):</span>
                                            <span style={{ color: pink, fontWeight: 700 }}>{(bet * 100).toFixed(2)} USDT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auto Spin placeholder */}
                            <div className="card mb-3">
                                <div className="card-header"><h4>Auto Spin</h4></div>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[5, 10, 25, 50].map(v => (
                                            <button key={v} className="bet-btn" disabled style={{ opacity: 0.5 }}>
                                                {v} spins
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-muted fs-sm mt-2 mb-0" style={{ textAlign: 'center', marginTop: 10 }}>
                                        Coming soon
                                    </p>
                                </div>
                            </div>

                            {/* Symbol legend */}
                            <div style={{
                                background: `linear-gradient(135deg, ${pinkFaint}0.08), ${pinkFaint}0.03))`,
                                border: `1px solid ${pinkFaint}0.25)`,
                                borderRadius: 14, padding: '16px 18px',
                                marginBottom: 14,
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: pink }}>
                                    Hot Symbols
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {SYMBOLS.slice(0, 4).map(s => (
                                        <div key={s.id} className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '1.1rem' }}>{s.emoji} <span className="text-muted fs-sm">{s.label}</span></span>
                                            <span style={{ color: pink, fontWeight: 700, fontSize: '0.82rem' }}>{s.payout3}x</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deposit CTA */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(38,161,123,0.1), rgba(38,161,123,0.05))',
                                border: '1px solid rgba(38,161,123,0.3)',
                                borderRadius: 14, padding: '18px 20px',
                            }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                                    💳 Need more USDT?
                                </div>
                                <p className="text-muted fs-sm mb-3">
                                    Deposit USDT (TRC-20) to keep playing.
                                </p>
                                <button className="copy-btn" onClick={() => setShowDeposit(true)}>
                                    Deposit Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="card mt-4">
                            <div className="card-header">
                                <h4>Spin History</h4>
                                <span className="text-muted fs-sm">{history.length} spins</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Result</th>
                                            <th>Bet</th>
                                            <th>Payout</th>
                                            <th>Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td className="text-muted fs-sm">{h.time}</td>
                                                <td style={{ fontSize: '1.3rem', letterSpacing: 4 }}>
                                                    {h.symbols.map(s => s.emoji).join(' ')}
                                                </td>
                                                <td className="text-muted fs-sm">{h.bet.toFixed(2)}</td>
                                                <td className="fs-sm" style={{ color: h.winnings > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                                    {h.winnings.toFixed(2)}
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
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">💳 Deposit USDT (TRC-20)</h3>
                        <p className="text-muted fs-sm mb-3">Send USDT on TRON (TRC-20) to this address:</p>
                        <div className="deposit-address-box">YOUR_USDT_WALLET_ADDRESS</div>
                        <button className="copy-btn" onClick={copyAddress}>
                            {copied ? '✅ Copied!' : '📋 Copy Address'}
                        </button>
                        <div style={{ marginTop: 16, padding: 12, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ⚠️ Only send <strong style={{ color: 'var(--primary)' }}>USDT TRC-20</strong>. Min: <strong>10 USDT</strong>.
                        </div>
                        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <p className="fs-sm text-muted mb-2">Demo — add funds:</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[100, 500, 1000].map(v => (
                                    <button key={v} onClick={() => { setBalance(prev => +(prev + v).toFixed(2)); setShowDeposit(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--usdt)', background: 'rgba(38,161,123,0.1)', color: 'var(--usdt)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>+{v}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EroticSlots;
