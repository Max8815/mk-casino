import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import ProvablyFairPanel from '../components/ProvablyFairPanel';
import { newServerSeed, deriveHash, deriveSlots, generateRandomHex } from '../../utils/provablyFair';

const SYMBOLS = [
    { id: 'f1',    emoji: '🏎', label: 'F1',       payout3: 100, payout2: 5, weight: 2 },
    { id: 'super', emoji: '🚀', label: 'Rocket',   payout3: 50,  payout2: 3, weight: 3 },
    { id: 'sports',emoji: '🚗', label: 'Car',      payout3: 20,  payout2: 2, weight: 5 },
    { id: 'suv',   emoji: '🚙', label: 'SUV',      payout3: 10,  payout2: 1, weight: 7 },
    { id: 'taxi',  emoji: '🚕', label: 'Taxi',     payout3: 5,   payout2: 0, weight: 9 },
    { id: 'flag',  emoji: '🏁', label: 'Flag',     payout3: 3,   payout2: 0, weight: 10 },
    { id: 'key',   emoji: '🔑', label: 'Key',      payout3: 2,   payout2: 0, weight: 12 },
    { id: 'star',  emoji: '★',  label: 'Star',     payout3: 1.5, payout2: 0, weight: 14 },
];

const POOL = SYMBOLS.flatMap(s => Array(s.weight).fill(s));
const randomSymbol = () => POOL[Math.floor(Math.random() * POOL.length)];
const makeStrip = (n = 30) => Array.from({ length: n }, randomSymbol);

const REEL_COUNT = 3;
const VISIBLE_ROWS = 3;
const SYMBOL_HEIGHT = 80;
const PAYLINE_INDEX = 1;

const evaluate = (results, betAmount) => {
    const [a, b, c] = results;
    let winnings = 0;
    let lines = [];
    if (a.id === b.id && b.id === c.id) {
        winnings = betAmount * a.payout3;
        lines.push({ type: '3 of a kind', symbol: a, payout: a.payout3 });
    } else if (a.id === b.id && a.payout2 > 0) {
        winnings = betAmount * a.payout2;
        lines.push({ type: '2 of a kind', symbol: a, payout: a.payout2 });
    } else if (b.id === c.id && b.payout2 > 0) {
        winnings = betAmount * b.payout2;
        lines.push({ type: '2 of a kind', symbol: b, payout: b.payout2 });
    }
    return { winnings: +winnings.toFixed(2), lines };
};

const Reel = ({ strip, targetIndex, spinning, delay, onDone }) => {
    const reelRef = useRef(null);
    const animRef = useRef(null);

    React.useEffect(() => {
        if (!spinning) return;
        const el = reelRef.current;
        if (!el) return;
        const fullStrip = SYMBOL_HEIGHT * strip.length;
        const targetOffset = targetIndex * SYMBOL_HEIGHT;
        const spinDistance = fullStrip * 5 + targetOffset;
        const duration = 2000 + delay;
        let startTime = null;
        let startScroll = el.scrollTop % fullStrip;
        const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const frame = (ts) => {
            if (!startTime) startTime = ts;
            const elapsed = ts - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.scrollTop = startScroll + spinDistance * ease(progress);
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
            width: SYMBOL_HEIGHT + 16,
            height: SYMBOL_HEIGHT * VISIBLE_ROWS,
            overflow: 'hidden',
            borderRadius: 'var(--radius)',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
        }}>
            <div style={{
                position: 'absolute',
                top: SYMBOL_HEIGHT * PAYLINE_INDEX,
                left: 0, right: 0,
                height: SYMBOL_HEIGHT,
                background: 'rgba(232,0,15,0.06)',
                borderTop: '1px solid rgba(232,0,15,0.3)',
                borderBottom: '1px solid rgba(232,0,15,0.3)',
                zIndex: 2, pointerEvents: 'none',
            }} />
            <div ref={reelRef} style={{ height: '100%', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                {[...strip, ...strip, ...strip].map((sym, i) => (
                    <div key={i} style={{
                        height: SYMBOL_HEIGHT, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.4rem', userSelect: 'none',
                    }}>{sym.emoji}</div>
                ))}
            </div>
        </div>
    );
};

const INITIAL_BALANCE = 1000;

const Slots = () => {
    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [betAmount, setBetAmount] = useState('10');
    const [spinning, setSpinning] = useState(false);
    const [strips] = useState(() => Array.from({ length: REEL_COUNT }, () => makeStrip(30)));
    const [targets, setTargets] = useState([0, 0, 0]);
    const [lastWin, setLastWin] = useState(null);
    const [history, setHistory] = useState([]);
    const [showDeposit, setShowDeposit] = useState(false);
    const [copied, setCopied] = useState(false);

    // Provably fair state
    const [serverSeed, setServerSeed] = useState('');
    const [serverSeedHash, setServerSeedHash] = useState('');
    const [clientSeed, setClientSeed] = useState(() => generateRandomHex(8));
    const [nonce, setNonce] = useState(0);
    const [lastGame, setLastGame] = useState(null);

    useEffect(() => {
        newServerSeed().then(({ serverSeed: s, serverSeedHash: h }) => {
            setServerSeed(s);
            setServerSeedHash(h);
        });
    }, []);

    const bet = parseFloat(betAmount) || 0;

    // Memoized callback to properly capture all dependencies and avoid stale closures
    const handleSpin = useCallback(async () => {
        if (spinning || bet <= 0 || bet > balance) return;
        setSpinning(true);
        setLastWin(null);
        setBalance(prev => +(prev - bet).toFixed(2));

        // Derive reel target indices from hash (provably fair)
        const hash = await deriveHash(serverSeed, clientSeed, nonce);
        const poolSize = strips[0].length; // all strips same length
        const hashTargets = deriveSlots(hash, REEL_COUNT, poolSize);

        // Capture for verification record before state changes
        const roundServerSeed = serverSeed;
        const roundClientSeed = clientSeed;
        const roundNonce = nonce;

        setTargets(hashTargets);
        const paylineSymbols = hashTargets.map((idx, r) => strips[r][idx]);

        // Calculate animation completion time based on reel count
        const animationDuration = 2000 + (REEL_COUNT - 1) * 400 + 300;

        // Create memoized completion callback with proper closure
        const onAllDone = async () => {
            const { winnings, lines } = evaluate(paylineSymbols, bet);
            setBalance(prev => +(prev + winnings).toFixed(2));
            setLastWin({ winnings, lines, bet });
            setHistory(prev => [{
                id: Date.now(), symbols: paylineSymbols, bet, winnings,
                net: +(winnings - bet).toFixed(2),
                time: new Date().toLocaleTimeString(),
            }, ...prev].slice(0, 20));
            setSpinning(false);

            // Reveal server seed, prepare next round
            setLastGame({
                serverSeed: roundServerSeed,
                clientSeed: roundClientSeed,
                nonce: roundNonce,
                outcome: hashTargets,
                poolSize,
            });
            setNonce(n => n + 1);
            const { serverSeed: nextSeed, serverSeedHash: nextHash } = await newServerSeed();
            setServerSeed(nextSeed);
            setServerSeedHash(nextHash);
        };

        setTimeout(onAllDone, animationDuration);
    }, [spinning, bet, balance, strips, serverSeed, clientSeed, nonce]);

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

    const isJackpot = lastWin?.lines?.some(l => l.symbol.id === 'f1' && l.type.includes('3'));

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} onDeposit={() => setShowDeposit(true)} />

            <div className="content-body">
                <div className="content-inner">

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem', color: 'var(--white)' }}>Car Slots</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2, marginBottom: 0 }}>3-Reel · Up to 100x</p>
                        </div>
                    </div>

                    {stats && (
                        <div className="stats-grid" style={{ marginBottom: 16 }}>
                            <div className="stat-card"><div className="stat-label">Balance</div><div className="stat-value usdt">{balance.toFixed(2)}</div></div>
                            <div className="stat-card"><div className="stat-label">Spins</div><div className="stat-value">{stats.total}</div></div>
                            <div className="stat-card"><div className="stat-label">Wins</div><div className="stat-value positive">{stats.wins}</div></div>
                            <div className="stat-card">
                                <div className="stat-label">P&L</div>
                                <div className={`stat-value ${parseFloat(stats.profit) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(stats.profit) >= 0 ? '+' : ''}{stats.profit}
                                </div>
                            </div>
                        </div>
                    )}

                    {isJackpot && (
                        <div style={{ background: 'rgba(232,0,15,0.08)', border: '1px solid rgba(232,0,15,0.3)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16, animation: 'fadeUp 0.3s' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--white)' }}>JACKPOT +{lastWin.winnings.toFixed(2)} USDT</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Three F1 cars · 100x payout</div>
                        </div>
                    )}

                    {lastWin && !isJackpot && (
                        <div className={`result-alert ${lastWin.winnings > 0 ? 'win' : 'lose'}`}>
                            <span className="result-alert-icon">{lastWin.winnings > 0 ? '↑' : '↓'}</span>
                            <div className="result-alert-text">
                                <h5>{lastWin.winnings > 0 ? `Won ${lastWin.winnings.toFixed(2)} USDT` : 'No match'}</h5>
                                <p>{lastWin.lines.length > 0 ? lastWin.lines.map(l => `${l.type} · ${l.payout}x`).join(' · ') : 'Better luck next spin'} · Net: {lastWin.winnings - lastWin.bet >= 0 ? '+' : ''}{(lastWin.winnings - lastWin.bet).toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-xl-7">
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div className="card-body" style={{ padding: '24px 20px' }}>
                                    <div style={{
                                        background: 'var(--black)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '20px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Car Slots</div>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                            {strips.map((strip, i) => (
                                                <Reel key={i} strip={strip} targetIndex={targets[i]} spinning={spinning} delay={i * 400} />
                                            ))}
                                        </div>
                                        <button className="spin-btn" onClick={handleSpin} disabled={spinning || bet <= 0 || bet > balance} style={{ width: '100%', maxWidth: 280 }}>
                                            {spinning ? 'Spinning...' : 'Spin'}
                                        </button>
                                        {bet > balance && <p style={{ color: 'var(--red)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Insufficient balance.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><h4>Paytable</h4></div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    <table className="history-table">
                                        <thead><tr><th>Symbol</th><th>3 of a Kind</th><th>2 of a Kind</th></tr></thead>
                                        <tbody>
                                            {SYMBOLS.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontSize: '1.3rem' }}>{s.emoji}</td>
                                                    <td><span style={{ color: 'var(--red)', fontWeight: 700 }}>{s.payout3}x</span></td>
                                                    <td>{s.payout2 > 0 ? <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{s.payout2}x</span> : <span className="text-muted">—</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-5">
                            <div className="card" style={{ marginBottom: 12 }}>
                                <div className="card-header"><h4>Bet Amount</h4></div>
                                <div className="card-body">
                                    <div className="amount-input-wrapper">
                                        <span className="amount-currency">USDT</span>
                                        <input type="number" className="amount-input" value={betAmount} min="1" step="1" onChange={e => setBetAmount(e.target.value)} disabled={spinning} placeholder="0.00" />
                                    </div>
                                    <div className="quick-amounts">
                                        {[1, 5, 10, 25, 50, 100].map(v => (
                                            <button key={v} className="quick-btn" onClick={() => setBetAmount(String(v))} disabled={spinning}>{v}</button>
                                        ))}
                                        <button className="quick-btn" onClick={() => setBetAmount(String(Math.floor(balance / 2)))} disabled={spinning} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>Half</button>
                                    </div>
                                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--card2)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Bet:</span><span style={{ color: 'var(--white)', fontWeight: 700 }}>{bet.toFixed(2)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span className="text-muted">Max win:</span><span style={{ color: 'var(--red)', fontWeight: 700 }}>{(bet * 100).toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(232,0,15,0.06)',
                                border: '1px solid rgba(232,0,15,0.2)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '16px 18px',
                            }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>Need more USDT?</div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12 }}>Deposit USDT (TRC-20)</p>
                                <button className="copy-btn" onClick={() => setShowDeposit(true)}>Deposit</button>
                            </div>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <div className="card mt-4">
                            <div className="card-header"><h4>History</h4><span className="text-muted fs-sm">{history.length} spins</span></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="history-table">
                                    <thead><tr><th>Time</th><th>Result</th><th>Bet</th><th>Net</th></tr></thead>
                                    <tbody>
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td className="text-muted fs-sm">{h.time}</td>
                                                <td style={{ fontSize: '1.2rem', letterSpacing: 3 }}>{h.symbols.map(s => s.emoji).join(' ')}</td>
                                                <td className="text-muted fs-sm">{h.bet.toFixed(2)}</td>
                                                <td><span className={h.net >= 0 ? 'win-badge' : 'lose-badge'}>{h.net >= 0 ? '+' : ''}{h.net.toFixed(2)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <ProvablyFairPanel
                        game="slots"
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
                        <div className="deposit-address-box">YOUR_USDT_WALLET_ADDRESS</div>
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

export default Slots;
