import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const GAMES = [
    {
        id: 'roulette',
        icon: '🎡',
        title: 'Roulette',
        sub: 'European · Single Zero',
        badge: 'live',
        to: '/roulette',
    },
    {
        id: 'blackjack',
        icon: '🃏',
        title: 'Blackjack',
        sub: '21 · Beat the Dealer',
        badge: 'soon',
        to: '#',
    },
    {
        id: 'slots',
        icon: '🚗',
        title: 'Car Slots',
        sub: '3-Reel · Up to 100x',
        badge: 'live',
        to: '/slots',
    },
    {
        id: 'crash',
        icon: '📈',
        title: 'Crash',
        sub: 'Multiplier Game',
        badge: 'soon',
        to: '#',
    },
    {
        id: 'dice',
        icon: '🎲',
        title: 'Dice',
        sub: 'Roll to Win',
        badge: 'soon',
        to: '#',
    },
    {
        id: 'baccarat',
        icon: '🏆',
        title: 'Baccarat',
        sub: 'Punto Banco',
        badge: 'soon',
        to: '#',
    },
];

const Dashboard = () => {
    const [balance] = useState(1000);

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} />

            <div className="content-body">
                <div className="content-inner">
                    <div className="mb-4">
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>
                            Welcome to MK Casino
                        </h3>
                        <p className="text-muted fs-sm mb-0" style={{ marginTop: 4 }}>
                            Bet with USDT · Provably Fair · Instant Payouts
                        </p>
                    </div>

                    {/* Balance Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #14141f 100%)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        borderRadius: 16,
                        padding: '24px 28px',
                        marginBottom: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16,
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                                Casino Balance
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--usdt)' }}>
                                {balance.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USDT</span>
                            </div>
                        </div>
                        <Link to="/roulette" style={{
                            display: 'inline-block',
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            borderRadius: 12,
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                        }}>
                            🎡 Play Roulette
                        </Link>
                    </div>

                    {/* Games Grid */}
                    <h4 style={{ fontWeight: 700, marginBottom: 16, color: '#fff' }}>Games</h4>
                    <div className="games-grid">
                        {GAMES.map(g => (
                            <Link
                                key={g.id}
                                to={g.to}
                                className={`game-card ${g.badge === 'live' ? 'active' : 'coming-soon'}`}
                            >
                                <div className="game-card-icon">{g.icon}</div>
                                <div className="game-card-title">{g.title}</div>
                                <div className="game-card-sub" style={{ marginBottom: 10 }}>{g.sub}</div>
                                {g.badge === 'live'
                                    ? <span className="badge-live">Live</span>
                                    : <span className="badge-soon">Coming Soon</span>
                                }
                            </Link>
                        ))}
                    </div>

                    {/* Info Banner */}
                    <div style={{
                        marginTop: 32,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 16,
                    }}>
                        {[
                            { icon: '🔒', title: 'Provably Fair', desc: 'Every spin is verifiable on-chain' },
                            { icon: '⚡', title: 'Instant Payouts', desc: 'Winnings sent directly to your wallet' },
                            { icon: '💎', title: 'USDT Only', desc: 'Tether TRC-20 accepted' },
                            { icon: '🤖', title: 'AI Powered', desc: 'Smart game recommendations' },
                        ].map(item => (
                            <div key={item.title} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 14,
                                padding: '18px 20px',
                                display: 'flex',
                                gap: 14,
                                alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{item.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
