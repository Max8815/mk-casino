import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const GAMES = [
    { id: 'roulette', icon: '🎡', title: 'Roulette',     sub: 'European · Single Zero',      badge: 'live', to: '/roulette',     desc: 'Bet on numbers, colours and dozens. House edge 2.7%.' },
    { id: 'slots',    icon: '🚗', title: 'Car Slots',     sub: '3-Reel · Up to 100x',         badge: 'live', to: '/slots',         desc: 'High-speed 3-reel machine. Land Formula 1 for 100x jackpot.' },
    { id: 'erotic',   icon: '💋', title: 'Erotic Slots',  sub: '3-Reel · Up to 100x · 18+',   badge: 'live', to: '/erotic-slots',  desc: '18+ themed 3-reel machine. Three kisses pays 100x!' },
    { id: 'bj',       icon: '🃏', title: 'Blackjack',     sub: '21 · Beat the Dealer',        badge: 'soon', to: '#',              desc: 'Classic 21. Surrender, double-down and split available.' },
    { id: 'crash',    icon: '📈', title: 'Crash',         sub: 'Multiplier · Cash Out Any Time', badge: 'soon', to: '#',           desc: 'Watch the multiplier climb. Cash out before it crashes.' },
    { id: 'dice',     icon: '🎲', title: 'Dice',          sub: 'Roll to Win · Provably Fair',  badge: 'soon', to: '#',             desc: 'Choose your range, set your odds, roll the dice.' },
    { id: 'baccarat', icon: '🏆', title: 'Baccarat',      sub: 'Punto Banco · Live Tables',    badge: 'soon', to: '#',             desc: 'The James Bond game. Bet Banker, Player or Tie.' },
    { id: 'plinko',   icon: '🔴', title: 'Plinko',        sub: 'Drop · Bounce · Win',          badge: 'soon', to: '#',             desc: 'Drop the ball and watch it bounce to a multiplier slot.' },
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

                    {/* Welcome banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(200,0,17,0.1) 0%, rgba(200,0,17,0.03) 100%)',
                        border: '1px solid rgba(200,0,17,0.25)',
                        borderRadius: 22,
                        padding: '28px 32px',
                        marginBottom: 28,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 20,
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #CC0011, transparent)' }} />

                        <div>
                            <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,0,17,0.45)', marginBottom: 6 }}>
                                Welcome Back
                            </div>
                            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                                <span className="gold-text-static">{user?.username || 'Player'}</span>
                            </h2>
                            <p style={{ color: 'rgba(200,0,17,0.45)', fontSize: '0.82rem', marginTop: 4, marginBottom: 0 }}>
                                {user?.isNew ? '🎁 Your $100 welcome bonus has been credited!' : 'Ready to play? Choose your game below.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(200,0,17,0.4)', marginBottom: 4 }}>
                                    Balance
                                </div>
                                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', fontWeight: 800, color: '#2ECC9F' }}>
                                    {balance.toFixed(2)}&nbsp;<span style={{ fontSize: '0.9rem', color: 'rgba(46,204,159,0.6)' }}>USDT</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-deposit" onClick={() => setShowDeposit(true)} style={{ padding: '8px 18px' }}>
                                    + Deposit
                                </button>
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'none',
                                            border: '1px solid rgba(200,0,17,0.25)',
                                            borderRadius: 30,
                                            color: 'rgba(200,0,17,0.45)',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontFamily: 'Poppins, sans-serif',
                                            letterSpacing: '0.04em',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section title */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,0,17,0.7)', margin: 0 }}>
                            ✦ Games
                        </h3>
                        <span className="badge-live">3 Live</span>
                    </div>

                    {/* Live games */}
                    <div className="games-grid mb-4">
                        {GAMES.map(g => (
                            <Link
                                key={g.id}
                                to={g.to}
                                className={`game-card ${g.badge === 'live' ? 'active' : 'coming-soon'}`}
                                onClick={g.badge !== 'live' ? e => e.preventDefault() : undefined}
                                style={{ position: 'relative' }}
                            >
                                <div className="game-card-icon">{g.icon}</div>
                                <div className="game-card-title">{g.title}</div>
                                <div className="game-card-sub">{g.sub}</div>
                                {g.desc && (
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(200,0,17,0.35)', marginTop: 6, lineHeight: 1.4, textAlign: 'center' }}>
                                        {g.desc}
                                    </div>
                                )}
                                <div style={{ marginTop: 10 }}>
                                    {g.badge === 'live'
                                        ? <span className="badge-live">▶ Play Now</span>
                                        : <span className="badge-soon">🔔 Coming Soon</span>
                                    }
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Info strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
                        {[
                            { icon: '🔒', title: 'Provably Fair',   desc: 'Every round verifiable on-chain' },
                            { icon: '⚡', title: 'Instant Payouts', desc: 'USDT TRC-20 sent directly to you' },
                            { icon: '🎁', title: '$100 Bonus',      desc: 'Free USDT for new members' },
                            { icon: '🤖', title: 'AI-Powered',      desc: 'Smart game recommendations' },
                        ].map(item => (
                            <div key={item.title} style={{
                                background: 'linear-gradient(145deg, var(--bg-card), var(--bg-card2))',
                                border: '1px solid var(--border)',
                                borderRadius: 16,
                                padding: '16px 18px',
                                display: 'flex', gap: 12, alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 0 6px rgba(200,0,17,0.3))' }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', color: 'var(--red-light)', marginBottom: 3 }}>{item.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(200,0,17,0.4)' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── INVEST SECTION ─────────────────────────────────────── */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Section heading */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,0,17,0.7)', margin: 0 }}>
                                ✦ Invest in MK Casino
                            </h3>
                            <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(46,204,159,0.12)', border: '1px solid rgba(46,204,159,0.35)', color: '#2ECC9F', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                                CNB APPROVED
                            </span>
                        </div>

                        {/* Main invest banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(200,0,17,0.08) 0%, rgba(200,0,17,0.02) 60%, rgba(46,204,159,0.05) 100%)',
                            border: '1px solid rgba(200,0,17,0.3)',
                            borderRadius: 22,
                            padding: '32px 36px',
                            marginBottom: 16,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Top accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #CC0011 30%, #2ECC9F 70%, transparent)' }} />

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
                                {/* Left: headline */}
                                <div style={{ flex: '1 1 280px' }}>
                                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,0,17,0.45)', marginBottom: 8 }}>
                                        Fixed-Income Investment · 5-Year Bonds
                                    </div>
                                    <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff', lineHeight: 1.2 }}>
                                        Earn <span style={{ color: '#CC0011' }}>10% p.a.</span>
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.6 }}>
                                        Guaranteed annual yield on MK Casino corporate bonds — approved by the <strong style={{ color: 'rgba(200,0,17,0.8)' }}>Czech National Bank</strong>. Your investment is backed by a consortium of angel investors.
                                    </p>

                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <button style={{
                                            padding: '12px 28px', borderRadius: 30,
                                            background: 'linear-gradient(135deg, #FF1122, #990000)',
                                            border: 'none', color: '#fff',
                                            fontFamily: 'Poppins, sans-serif',
                                            fontWeight: 800, fontSize: '0.88rem',
                                            letterSpacing: '0.06em', cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(200,0,17,0.35)',
                                        }}>
                                            Invest Now →
                                        </button>
                                        <button style={{
                                            padding: '12px 22px', borderRadius: 30,
                                            background: 'none',
                                            border: '1px solid rgba(200,0,17,0.35)',
                                            color: 'rgba(200,0,17,0.7)',
                                            fontFamily: 'Poppins, sans-serif',
                                            fontWeight: 600, fontSize: '0.85rem',
                                            cursor: 'pointer',
                                        }}>
                                            Download Prospectus
                                        </button>
                                    </div>
                                </div>

                                {/* Right: key facts */}
                                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
                                    {[
                                        { label: 'Annual Yield',       value: '10% p.a.',       color: '#CC0011' },
                                        { label: 'Bond Term',          value: '5 Years',         color: '#fff' },
                                        { label: 'Min. Investment',    value: '€ 4,000',         color: '#2ECC9F' },
                                        { label: 'Guarantee',          value: 'Angel Investors', color: '#fff' },
                                        { label: 'Regulator Approval', value: 'Czech Nat. Bank', color: '#2ECC9F' },
                                    ].map(f => (
                                        <div key={f.label} style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(200,0,17,0.15)',
                                            borderRadius: 12,
                                            padding: '10px 16px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                                        }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{f.label}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: f.color, whiteSpace: 'nowrap' }}>{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Three feature cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                            {[
                                {
                                    icon: '🏦',
                                    title: 'CNB Approved Prospectus',
                                    desc: 'Bond emission fully approved by the Czech National Bank under EU prospectus regulation.',
                                },
                                {
                                    icon: '🛡️',
                                    title: 'Angel Investor Guarantee',
                                    desc: 'Capital and yield payments are co-guaranteed by our consortium of angel investors.',
                                },
                                {
                                    icon: '📈',
                                    title: 'Fixed 10% Per Annum',
                                    desc: 'Predictable, fixed returns paid annually. Min. €4,000 entry. 5-year maturity.',
                                },
                                {
                                    icon: '🔐',
                                    title: 'Secure & Transparent',
                                    desc: 'Bond terms are publicly available. Full documentation provided upon request.',
                                },
                            ].map(item => (
                                <div key={item.title} style={{
                                    background: 'linear-gradient(145deg, rgba(200,0,17,0.06), rgba(200,0,17,0.02))',
                                    border: '1px solid rgba(200,0,17,0.18)',
                                    borderRadius: 16,
                                    padding: '18px 18px',
                                    display: 'flex', gap: 12, alignItems: 'flex-start',
                                }}>
                                    <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 6px rgba(200,0,17,0.3))', flexShrink: 0 }}>{item.icon}</span>
                                    <div>
                                        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em', color: 'var(--red-light)', marginBottom: 4 }}>{item.title}</div>
                                        <div style={{ fontSize: '0.73rem', color: 'rgba(200,0,17,0.38)', lineHeight: 1.5 }}>{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Disclaimer */}
                        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', marginTop: 14, lineHeight: 1.6 }}>
                            * Investment involves risk. Past performance is not a guarantee of future results. Bonds are subject to the approved prospectus filed with the Czech National Bank. Please read the full prospectus before investing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">💳 Deposit USDT TRC-20</h3>
                        <p style={{ color: 'rgba(200,0,17,0.45)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Send USDT on TRON network to this casino wallet address:
                        </p>
                        <div className="deposit-address-box">YOUR_USDT_WALLET_ADDRESS</div>
                        <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 16 }}>
                            {copied ? '✅ Copied!' : '📋 Copy Address'}
                        </button>
                        <div style={{ padding: '12px 14px', background: 'rgba(200,0,17,0.05)', border: '1px solid rgba(200,0,17,0.15)', borderRadius: 12, fontSize: '0.76rem', color: 'rgba(200,0,17,0.4)' }}>
                            ⚠️ Only send <strong style={{ color: 'var(--red-mid)' }}>USDT TRC-20</strong>. Minimum: <strong>10 USDT</strong>.
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.76rem', color: 'rgba(200,0,17,0.35)', marginBottom: 10 }}>Demo — add funds instantly:</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[100, 500, 1000].map(v => (
                                    <button key={v} onClick={() => setShowDeposit(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid rgba(38,161,123,0.4)', background: 'rgba(38,161,123,0.08)', color: '#2ECC9F', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
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

export default Dashboard;
