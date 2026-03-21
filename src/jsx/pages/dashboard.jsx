import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const GAMES = [
    { id: 'roulette', icon: '🎡', title: 'Roulette',  sub: 'European · Single Zero',  badge: 'live', to: '/roulette' },
    { id: 'slots',    icon: '🚗', title: 'Car Slots', sub: '3-Reel · Up to 100x',     badge: 'live', to: '/slots'    },
    { id: 'bj',       icon: '🃏', title: 'Blackjack', sub: '21 · Beat the Dealer',    badge: 'soon', to: '#'         },
    { id: 'crash',    icon: '📈', title: 'Crash',     sub: 'Multiplier Game',          badge: 'soon', to: '#'         },
    { id: 'dice',     icon: '🎲', title: 'Dice',      sub: 'Roll to Win',             badge: 'soon', to: '#'         },
    { id: 'baccarat', icon: '🏆', title: 'Baccarat',  sub: 'Punto Banco',             badge: 'soon', to: '#'         },
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
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.03) 100%)',
                        border: '1px solid rgba(212,175,55,0.25)',
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
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

                        <div>
                            <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginBottom: 6 }}>
                                Welcome Back
                            </div>
                            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                                <span className="gold-text-static">{user?.username || 'Player'}</span>
                            </h2>
                            <p style={{ color: 'rgba(212,175,55,0.45)', fontSize: '0.82rem', marginTop: 4, marginBottom: 0 }}>
                                {user?.isNew ? '🎁 Your $100 welcome bonus has been credited!' : 'Ready to play? Choose your game below.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)', marginBottom: 4 }}>
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
                                            border: '1px solid rgba(212,175,55,0.25)',
                                            borderRadius: 30,
                                            color: 'rgba(212,175,55,0.45)',
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
                        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', margin: 0 }}>
                            ✦ Games
                        </h3>
                        <span className="badge-live">2 Live</span>
                    </div>

                    <div className="games-grid mb-4">
                        {GAMES.map(g => (
                            <Link
                                key={g.id}
                                to={g.to}
                                className={`game-card ${g.badge === 'live' ? 'active' : 'coming-soon'}`}
                                onClick={g.badge !== 'live' ? e => e.preventDefault() : undefined}
                            >
                                <div className="game-card-icon">{g.icon}</div>
                                <div className="game-card-title">{g.title}</div>
                                <div className="game-card-sub">{g.sub}</div>
                                {g.badge === 'live'
                                    ? <span className="badge-live">Live</span>
                                    : <span className="badge-soon">Coming Soon</span>
                                }
                            </Link>
                        ))}
                    </div>

                    {/* Info strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
                                <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.3))' }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', color: 'var(--gold-light)', marginBottom: 3 }}>{item.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(212,175,55,0.4)' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {showDeposit && (
                <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDeposit(false)}>✕</button>
                        <h3 className="modal-title">💳 Deposit USDT TRC-20</h3>
                        <p style={{ color: 'rgba(212,175,55,0.45)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Send USDT on TRON network to this casino wallet address:
                        </p>
                        <div className="deposit-address-box">YOUR_USDT_WALLET_ADDRESS</div>
                        <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 16 }}>
                            {copied ? '✅ Copied!' : '📋 Copy Address'}
                        </button>
                        <div style={{ padding: '12px 14px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, fontSize: '0.76rem', color: 'rgba(212,175,55,0.4)' }}>
                            ⚠️ Only send <strong style={{ color: 'var(--gold-mid)' }}>USDT TRC-20</strong>. Minimum: <strong>10 USDT</strong>.
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.76rem', color: 'rgba(212,175,55,0.35)', marginBottom: 10 }}>Demo — add funds instantly:</p>
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
