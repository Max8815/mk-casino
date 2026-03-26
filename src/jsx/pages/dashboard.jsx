import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const GAMES = [
    { id: 'roulette', icon: '◉', title: 'Roulette',  sub: 'European · Single Zero', badge: 'live', to: '/roulette',    desc: 'Single zero. Multiple bet types.' },
    { id: 'slots',    icon: '◆', title: 'Car Slots', sub: '3-Reel · Up to 100x',   badge: 'live', to: '/slots',        desc: 'High-speed 3-reel machine.' },
    { id: 'erotic',   icon: '♥', title: 'Erotic',     sub: '3-Reel · Up to 100x',   badge: 'live', to: '/erotic-slots', desc: 'Themed 3-reel machine.' },
    { id: 'minesweeper', icon: '💣', title: 'Minesweeper', sub: '5x5 · Up to 10x',     badge: 'new',  to: '/minesweeper',   desc: 'Pick cells, dodge mines.' },
    { id: 'crash',    icon: '▲', title: 'Crash',      sub: 'Multiplier · Cash Out',  badge: 'live', to: '/crash',        desc: 'Watch the multiplier climb.' },
    { id: 'racing',   icon: '🏎️', title: 'Racing',    sub: 'Dodge · Distance·Payout', badge: 'live', to: '/racing',       desc: 'Tap to dodge obstacles.' },
    { id: 'bj',       icon: '♠', title: 'Blackjack',  sub: '21 · Beat the Dealer',  badge: 'soon', to: '#',             desc: 'Classic 21.' },
];

const Dashboard = ({ user, onLogout }) => {
    const [balance] = useState(user?.balance ?? 1000);
    const [showDeposit, setShowDeposit] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        navigator.clipboard.writeText('YOUR_USDT_WALLET_ADDRESS');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} username={user?.username} onDeposit={() => setShowDeposit(true)} />

            <div className="content-body">
                <div className="content-inner">

                    {/* Welcome */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4, fontWeight: 700 }}>
                            Welcome back
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                            {user?.username || 'Player'}
                        </h2>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-label">Balance</div>
                            <div className="stat-value usdt">{balance.toFixed(2)} USDT</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Bonus</div>
                            <div className="stat-value" style={{ color: 'var(--red)' }}>100 USDT</div>
                        </div>
                    </div>

                    {/* Games */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                                Games
                            </h3>
                            <span className="badge-live">5 Live</span>
                        </div>

                        <div className="games-grid">
                            {GAMES.map(g => (
                                <Link
                                    key={g.id}
                                    to={g.to}
                                    className={`game-card ${g.badge === 'live' ? '' : 'coming-soon'}`}
                                    onClick={g.badge !== 'live' ? e => e.preventDefault() : undefined}
                                >
                                    <div className="game-card-icon">{g.icon}</div>
                                    <div className="game-card-title">{g.title}</div>
                                    <div className="game-card-sub">{g.sub}</div>
                                    <div style={{ marginTop: 8 }}>
                                        {g.badge === 'live'
                                            ? <span className="badge-live">Play</span>
                                            : <span className="badge-soon">Soon</span>
                                        }
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
                        {[
                            { icon: '▲', title: 'Wallet', sub: 'Deposit & Withdraw', to: '/wallet' },
                            { icon: '■', title: 'History', sub: 'Game history', to: '/history' },
                        ].map(item => (
                            <Link key={item.to} to={item.to} style={{
                                background: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '16px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                textDecoration: 'none',
                                color: 'var(--white)',
                                transition: 'border-color 0.15s',
                            }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                <span style={{ fontSize: '1.4rem', opacity: 0.5 }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{item.sub}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Investment Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                                Invest
                            </h3>
                            <span style={{ padding: '2px 8px', borderRadius: 2, background: 'rgba(232,0,15,0.08)', border: '1px solid rgba(232,0,15,0.2)', color: 'var(--white)', fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CNB Approved</span>
                        </div>

                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 22px', background: 'var(--card)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--white)', marginBottom: 2 }}>
                                            10% p.a.
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 12 }}>
                                            Fixed annual yield · 5-Year Bond
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', maxWidth: 340, lineHeight: 1.5 }}>
                                            Earn guaranteed returns on MK Casino corporate bonds — approved by the Czech National Bank.
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                                        {[
                                            { label: 'Annual Yield', value: '10%', color: 'var(--white)' },
                                            { label: 'Bond Term', value: '5 Years', color: 'var(--white)' },
                                            { label: 'Min. Investment', value: '€4,000', color: 'var(--white)' },
                                        ].map(f => (
                                            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{f.label}</span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: f.color }}>{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                    <button style={{
                                        padding: '9px 20px', borderRadius: 'var(--radius)',
                                        background: 'var(--red)', border: 'none',
                                        color: 'var(--white)', fontFamily: 'var(--font)',
                                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                                    }}>
                                        Invest Now
                                    </button>
                                    <button style={{
                                        padding: '9px 16px', borderRadius: 'var(--radius)',
                                        background: 'transparent', border: '1px solid var(--border)',
                                        color: 'var(--muted)', fontFamily: 'var(--font)',
                                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                                    }}>
                                        Prospectus
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.68rem', color: 'var(--faint)', marginTop: 8, lineHeight: 1.5 }}>
                            * Investment involves risk. Bonds subject to approved prospectus. Please read full terms.
                        </p>
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">Deposit USDT</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Send USDT on TRON (TRC-20):
                        </p>
                        <div className="deposit-address-box">YOUR_USDT_WALLET_ADDRESS</div>
                        <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 16 }}>
                            {copied ? 'Copied!' : 'Copy Address'}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 16 }}>
                            Min: <strong style={{ color: 'var(--white)' }}>10 USDT</strong> · Only USDT TRC-20
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[100, 500, 1000].map(v => (
                                <button key={v} onClick={() => setShowDeposit(false)} style={{
                                    flex: 1, padding: '8px 0', borderRadius: 'var(--radius)',
                                    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)',
                                    color: 'var(--white)', fontWeight: 700, fontSize: '0.82rem',
                                    cursor: 'pointer', fontFamily: 'var(--font)',
                                }}>+{v}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
