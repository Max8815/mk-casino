import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const CASINO_WALLET = 'YOUR_USDT_WALLET_ADDRESS';
const WELCOME_BONUS = 100;

const Login = ({ onLogin }) => {
    const history = useHistory();
    const [tab, setTab] = useState('register');
    const [error, setError] = useState('');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [regAge, setRegAge] = useState(false);
    const [regTerms, setRegTerms] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [registered, setRegistered] = useState(false);

    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        navigator.clipboard.writeText(CASINO_WALLET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!loginEmail || !loginPassword) { setError('Please fill in all fields.'); return; }
        onLogin({ email: loginEmail, username: loginEmail.split('@')[0], balance: 1000 });
        history.push('/');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');
        if (!regUsername || !regEmail || !regPassword || !regConfirm) { setError('Please fill in all fields.'); return; }
        if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
        if (!regAge) { setError('You must confirm you are 18 years or older.'); return; }
        if (!regTerms) { setError('Please accept the Terms of Service.'); return; }
        setRegistered(true);
    };

    const handleClaim = () => {
        onLogin({ email: regEmail, username: regUsername, balance: WELCOME_BONUS, isNew: true });
        history.push('/');
    };

    const TABS = [
        { id: 'register', label: 'Register' },
        { id: 'login',    label: 'Login' },
        { id: 'deposit',  label: 'Deposit' },
    ];

    return (
        <div className="login-page">

            {/* ── LEFT ── */}
            <div className="login-hero">
                <div className="login-hero-content">
                    <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>MK</div>
                    <h1 className="hero-title">CASINO</h1>
                    <p className="hero-subtitle">Premium Crypto Gaming</p>

                    <div style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px 24px',
                        marginBottom: 28,
                        textAlign: 'left',
                    }}>
                        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>
                            Welcome Bonus
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--white)', marginBottom: 4 }}>
                            $100 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)' }}>USDT</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Free on registration</div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        {[
                            { title: 'Roulette', sub: 'European · Single zero' },
                            { title: 'Slots', sub: '3-reel · Up to 100x' },
                            { title: 'Instant Payouts', sub: 'USDT TRC-20 withdrawals' },
                        ].map(f => (
                            <div key={f.title} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '10px 0',
                                borderBottom: '1px solid var(--border)',
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ fontWeight: 700, color: 'var(--white)' }}>{f.title}</span>
                                <span style={{ color: 'var(--muted)' }}>{f.sub}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="login-form-side">
                <div className="login-form-inner">

                    <div className="login-logo">
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>MK CASINO</div>
                    </div>

                    {/* Tabs */}
                    <div className="form-tabs">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                className={`form-tab ${tab === t.id ? 'active' : ''}`}
                                onClick={() => { setTab(t.id); setError(''); }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── REGISTER ── */}
                    {tab === 'register' && (
                        registered ? (
                            <div style={{ animation: 'fadeUp 0.3s ease' }}>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '28px 22px',
                                    marginBottom: 20,
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>✓</div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)', marginBottom: 8 }}>
                                        Welcome, {regUsername}
                                    </h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 18 }}>
                                        Account created. Claim your $100 bonus.
                                    </p>
                                    <div style={{
                                        background: 'var(--card2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        padding: '14px',
                                        marginBottom: 18,
                                    }}>
                                        <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Bonus</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)' }}>$100 USDT</div>
                                    </div>
                                    <button className="spin-btn" onClick={handleClaim}>
                                        Claim Bonus
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister}>
                                {error && <div className="error-msg">{error}</div>}

                                <div className="form-field">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-input" placeholder="Choose a username"
                                        value={regUsername} onChange={e => { setRegUsername(e.target.value); setError(''); }} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" placeholder="you@example.com"
                                        value={regEmail} onChange={e => { setRegEmail(e.target.value); setError(''); }} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" placeholder="Min. 6 characters"
                                        value={regPassword} onChange={e => { setRegPassword(e.target.value); setError(''); }} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Confirm Password</label>
                                    <input type="password" className="form-input" placeholder="Repeat password"
                                        value={regConfirm} onChange={e => { setRegConfirm(e.target.value); setError(''); }} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Promo Code <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span></label>
                                    <input type="text" className="form-input" placeholder="Enter code"
                                        value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                        style={{ paddingRight: 80 }} />
                                </div>

                                <div style={{ height: 4 }} />
                                <div className="checkbox-row">
                                    <input type="checkbox" id="age-check" checked={regAge} onChange={e => setRegAge(e.target.checked)} />
                                    <label htmlFor="age-check">I am 18+ and gambling is legal in my jurisdiction</label>
                                </div>
                                <div className="checkbox-row">
                                    <input type="checkbox" id="terms-check" checked={regTerms} onChange={e => setRegTerms(e.target.checked)} />
                                    <label htmlFor="terms-check">I accept the <a href="#terms">Terms</a> & <a href="#privacy">Privacy</a></label>
                                </div>

                                <div style={{ height: 6 }} />
                                <button type="submit" className="spin-btn">Create Account</button>

                                <div className="or-divider">or</div>
                                <button type="button" className="btn-secondary" onClick={() => {
                                    onLogin({ email: 'guest@mkcasino.io', username: 'Guest', balance: 50, isGuest: true });
                                    history.push('/');
                                }}>
                                    Continue as Guest
                                </button>
                            </form>
                        )
                    )}

                    {/* ── LOGIN ── */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin}>
                            {error && <div className="error-msg">{error}</div>}
                            <div className="form-field">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" placeholder="you@example.com"
                                    value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setError(''); }} />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-input" placeholder="••••••••"
                                    value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setError(''); }} />
                            </div>
                            <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -6 }}>
                                <a href="#reset" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Forgot password?</a>
                            </div>
                            <button type="submit" className="spin-btn" style={{ marginBottom: 10 }}>Login</button>
                            <div className="or-divider">or</div>
                            <button type="button" className="btn-secondary" onClick={() => {
                                onLogin({ email: 'guest@mkcasino.io', username: 'Guest', balance: 50, isGuest: true });
                                history.push('/');
                            }}>
                                Continue as Guest
                            </button>
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    No account?{' '}
                                    <button type="button" onClick={() => setTab('register')} style={{
                                        background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '0.75rem', fontFamily: 'var(--font)',
                                    }}>Register free →</button>
                                </span>
                            </div>
                        </form>
                    )}

                    {/* ── DEPOSIT ── */}
                    {tab === 'deposit' && (
                        <div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 16 }}>
                                Min deposit: <strong style={{ color: 'var(--white)' }}>10 USDT</strong> · TRC-20 network
                            </div>
                            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Casino Wallet</label>
                            <div className="deposit-address-box">{CASINO_WALLET}</div>
                            <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 20 }}>
                                {copied ? 'Copied!' : 'Copy Address'}
                            </button>

                            <div className="deposit-steps">
                                {[
                                    'Open your USDT wallet app',
                                    'Select TRON (TRC-20) network',
                                    `Send min 10 USDT to the address above`,
                                    'Balance credited after confirmation',
                                ].map((text, i) => (
                                    <div key={i} className="deposit-step">
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-text">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="spin-btn" onClick={() => setTab('register')} style={{ marginTop: 8 }}>
                                Register to Play →
                            </button>
                        </div>
                    )}

                    <div className="login-footer">
                        SSL Encrypted · 18+ · Play Responsibly
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
