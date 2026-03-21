import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

// ─── Replace with your real TRC-20 wallet address ───────────────
const CASINO_WALLET = 'YOUR_USDT_WALLET_ADDRESS';
const MIN_DEPOSIT = 10;

const Login = ({ onLogin }) => {
    const history = useHistory();
    const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'deposit'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please fill in all fields'); return; }
        if (onLogin) onLogin({ email });
        history.push('/');
    };

    const handleGuest = () => {
        if (onLogin) onLogin({ email: 'guest@mkcasino.io', isGuest: true });
        history.push('/');
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(CASINO_WALLET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute',
                top: '20%', left: '50%',
                transform: 'translateX(-50%)',
                width: 600, height: 600,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🎰</div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        MK Casino
                    </h1>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Bet with USDT · Instant Payouts · Provably Fair
                    </p>
                </div>

                {/* Card */}
                <div className="card">
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                        {[
                            { id: 'login', label: 'Login' },
                            { id: 'signup', label: 'Sign Up' },
                            { id: 'deposit', label: '💳 Deposit' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    flex: 1, padding: '14px 8px',
                                    background: 'none', border: 'none',
                                    color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: tab === t.id ? 700 : 500,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    marginBottom: -1,
                                    fontFamily: 'Poppins, sans-serif',
                                    transition: 'color 0.2s',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="card-body">
                        {/* ── LOGIN TAB ── */}
                        {tab === 'login' && (
                            <form onSubmit={handleLogin}>
                                {error && (
                                    <div style={{
                                        background: 'rgba(244,106,106,0.1)',
                                        border: '1px solid var(--danger)',
                                        borderRadius: 8, padding: '10px 14px',
                                        color: 'var(--danger)', fontSize: '0.82rem',
                                        marginBottom: 16,
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Email
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <input
                                            type="email"
                                            className="amount-input"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setError(''); }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Password
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <input
                                            type="password"
                                            className="amount-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="spin-btn" style={{ marginBottom: 10 }}>
                                    Login & Play
                                </button>

                                <div style={{ textAlign: 'center', margin: '14px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    — or —
                                </div>

                                <button type="button" className="clear-btn" onClick={handleGuest} style={{ marginTop: 0 }}>
                                    👤 Continue as Guest
                                </button>
                            </form>
                        )}

                        {/* ── SIGN UP TAB ── */}
                        {tab === 'signup' && (
                            <form onSubmit={handleLogin}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Email
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <input type="email" className="amount-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Password
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <input type="password" className="amount-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Confirm Password
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <input type="password" className="amount-input" placeholder="••••••••" />
                                    </div>
                                </div>

                                <button type="submit" className="spin-btn" style={{ marginBottom: 10 }}>
                                    Create Account
                                </button>

                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 12 }}>
                                    By signing up you agree to our Terms of Service.
                                    You must be 18+ to play.
                                </p>
                            </form>
                        )}

                        {/* ── DEPOSIT TAB ── */}
                        {tab === 'deposit' && (
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>
                                    Send <strong style={{ color: 'var(--usdt)' }}>USDT (TRC-20)</strong> to our casino wallet to load your balance and start playing instantly.
                                </p>

                                {/* Minimum deposit badge */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: 'rgba(38,161,123,0.08)',
                                    border: '1px solid rgba(38,161,123,0.3)',
                                    borderRadius: 10, padding: '10px 14px',
                                    marginBottom: 20,
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>💎</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--usdt)' }}>
                                            Minimum deposit: {MIN_DEPOSIT} USDT
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Credited after 1 network confirmation
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet address */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Casino Wallet Address (TRC-20)
                                    </label>
                                    <div className="deposit-address-box" style={{ fontSize: '0.88rem', color: '#fff', letterSpacing: '0.02em' }}>
                                        {CASINO_WALLET}
                                    </div>
                                </div>

                                <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 16 }}>
                                    {copied ? '✅ Copied to clipboard!' : '📋 Copy Wallet Address'}
                                </button>

                                {/* Network steps */}
                                <div style={{ marginBottom: 20 }}>
                                    {[
                                        { step: '1', text: 'Open your crypto wallet (Trust Wallet, Binance, etc.)' },
                                        { step: '2', text: 'Select USDT on the TRON (TRC-20) network' },
                                        { step: '3', text: `Send at least ${MIN_DEPOSIT} USDT to the address above` },
                                        { step: '4', text: 'Your balance is credited after 1 confirmation' },
                                    ].map(item => (
                                        <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                                            <span style={{
                                                minWidth: 24, height: 24, borderRadius: '50%',
                                                background: 'rgba(201,168,76,0.15)',
                                                border: '1px solid rgba(201,168,76,0.4)',
                                                color: 'var(--primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.72rem', fontWeight: 700,
                                            }}>
                                                {item.step}
                                            </span>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    padding: '10px 14px',
                                    background: 'rgba(244,106,106,0.06)',
                                    border: '1px solid rgba(244,106,106,0.2)',
                                    borderRadius: 10,
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                }}>
                                    ⚠️ Only send <strong style={{ color: '#e74c3c' }}>USDT TRC-20</strong>. Do not send ERC-20 or BEP-20 tokens — they will be lost.
                                </div>

                                <button className="spin-btn" style={{ marginTop: 20 }} onClick={() => setTab('login')}>
                                    I've Deposited — Login to Play
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 20 }}>
                    🔒 Secure · 18+ Only · Play Responsibly
                </p>
            </div>
        </div>
    );
};

export default Login;
