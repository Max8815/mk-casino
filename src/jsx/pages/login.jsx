import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const CASINO_WALLET = 'YOUR_USDT_WALLET_ADDRESS';
const WELCOME_BONUS = 100;

const Login = ({ onLogin }) => {
    const history = useHistory();
    const [tab, setTab] = useState('register'); // 'login' | 'register' | 'deposit'
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
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
        if (!regUsername || !regEmail || !regPassword || !regConfirm) {
            setError('Please fill in all required fields.'); return;
        }
        if (regPassword.length < 6) {
            setError('Password must be at least 6 characters.'); return;
        }
        if (regPassword !== regConfirm) {
            setError('Passwords do not match.'); return;
        }
        if (!regAge) {
            setError('You must confirm you are 18 years or older.'); return;
        }
        if (!regTerms) {
            setError('Please accept the Terms of Service.'); return;
        }
        setRegistered(true);
        setSuccess('');
    };

    const handleClaim = () => {
        onLogin({
            email: regEmail,
            username: regUsername,
            balance: WELCOME_BONUS,
            isNew: true,
        });
        history.push('/');
    };

    const TABS = [
        { id: 'register', label: '✦ Register' },
        { id: 'login',    label: 'Login' },
        { id: 'deposit',  label: '💳 Deposit' },
    ];

    return (
        <div className="login-page">

            {/* ── LEFT HERO PANEL ── */}
            <div className="login-hero">
                <div className="login-hero-bg" />
                <div className="login-hero-content">
                    <span className="hero-casino-icon">🎰</span>

                    <h1 className="hero-title">
                        <span className="gold-text">MK</span>
                        <br />
                        <span style={{ color: '#fff', fontSize: '2rem' }}>Casino</span>
                    </h1>
                    <p className="hero-subtitle">Premium Crypto Gaming</p>

                    {/* Promo highlight */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                        border: '1px solid rgba(212,175,55,0.4)',
                        borderRadius: 20,
                        padding: '22px 26px',
                        marginBottom: 32,
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: 2,
                            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                        }} />
                        <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: 8 }}>
                            Welcome Bonus
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg, #F7E07A, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                $100
                            </span>
                            <span style={{ color: 'rgba(212,175,55,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>FREE USDT</span>
                        </div>
                        <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: '0.78rem', margin: '6px 0 0', lineHeight: 1.5 }}>
                            Credited instantly on registration.<br/>No deposit required to claim.
                        </p>
                    </div>

                    <div className="hero-features">
                        {[
                            { icon: '🎡', title: 'European Roulette', desc: 'Single zero · Multiple bet types' },
                            { icon: '🚗', title: 'Car Slots', desc: '3-reel · Up to 100x jackpot' },
                            { icon: '⚡', title: 'USDT Payouts', desc: 'TRC-20 instant withdrawals' },
                            { icon: '🔒', title: 'Provably Fair', desc: 'Verified on-chain randomness' },
                        ].map(f => (
                            <div key={f.title} className="hero-feature">
                                <span className="hero-feature-icon">{f.icon}</span>
                                <div className="hero-feature-text">
                                    <strong>{f.title}</strong>
                                    <span>{f.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="login-form-side">
                <div className="login-form-inner">

                    {/* Logo (mobile only) */}
                    <div className="login-logo">
                        <span className="login-logo-icon">🎰</span>
                        <div className="gold-text login-logo-title">MK Casino</div>
                        <div className="login-logo-sub">Premium Crypto Gaming</div>
                    </div>

                    {/* Promo banner */}
                    <div className="promo-banner">
                        <span className="promo-icon">🎁</span>
                        <div className="promo-text">
                            <strong className="gold-text-static">Welcome Bonus</strong>
                            <p>Register now and get free USDT to start playing instantly</p>
                        </div>
                        <div className="promo-amount">
                            <div className="amount-big gold-text-static">${WELCOME_BONUS}</div>
                            <div className="amount-label">Free USDT</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="form-tabs">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                className={`form-tab ${tab === t.id ? 'active' : ''}`}
                                onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ REGISTER TAB ══ */}
                    {tab === 'register' && (
                        registered ? (
                            /* ── SUCCESS STATE ── */
                            <div style={{ animation: 'floatUp 0.4s ease' }}>
                                <div style={{
                                    textAlign: 'center',
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
                                    border: '1px solid rgba(212,175,55,0.4)',
                                    borderRadius: 18,
                                    padding: '32px 24px',
                                    marginBottom: 20,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
                                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                                    <h3 style={{ fontFamily: 'Cinzel, serif', color: '#F7E07A', fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Welcome, {regUsername}!
                                    </h3>
                                    <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: '0.82rem', marginBottom: 20 }}>
                                        Your account has been created. Your welcome bonus is ready to claim.
                                    </p>

                                    <div style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid rgba(212,175,55,0.3)',
                                        borderRadius: 14,
                                        padding: '18px',
                                        marginBottom: 20,
                                    }}>
                                        <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginBottom: 6 }}>
                                            Your Bonus
                                        </div>
                                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #F7E07A, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            ${WELCOME_BONUS} USDT
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(212,175,55,0.4)', marginTop: 4 }}>
                                            Credited instantly to your casino balance
                                        </div>
                                    </div>

                                    <button className="spin-btn" onClick={handleClaim} style={{ fontSize: '0.95rem', letterSpacing: '0.12em' }}>
                                        🎰 Claim Bonus & Play Now
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── REGISTER FORM ── */
                            <form onSubmit={handleRegister}>
                                {error && <div className="error-msg">{error}</div>}

                                <div className="form-field">
                                    <label className="form-label">Username *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${error && !regUsername ? 'error' : ''}`}
                                        placeholder="Choose a username"
                                        value={regUsername}
                                        onChange={e => { setRegUsername(e.target.value); setError(''); }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        className={`form-input ${error && !regEmail ? 'error' : ''}`}
                                        placeholder="you@example.com"
                                        value={regEmail}
                                        onChange={e => { setRegEmail(e.target.value); setError(''); }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Password *</label>
                                    <input
                                        type="password"
                                        className={`form-input ${error && !regPassword ? 'error' : ''}`}
                                        placeholder="Min. 6 characters"
                                        value={regPassword}
                                        onChange={e => { setRegPassword(e.target.value); setError(''); }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Confirm Password *</label>
                                    <input
                                        type="password"
                                        className={`form-input ${error && regPassword !== regConfirm ? 'error' : ''}`}
                                        placeholder="Repeat password"
                                        value={regConfirm}
                                        onChange={e => { setRegConfirm(e.target.value); setError(''); }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Promo Code <span style={{ color: 'rgba(212,175,55,0.3)' }}>(optional)</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter promo code"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                            style={{ paddingRight: 80 }}
                                        />
                                        <span style={{
                                            position: 'absolute', right: 14, top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '0.68rem', fontWeight: 800,
                                            color: 'rgba(212,175,55,0.35)',
                                            letterSpacing: '0.08em',
                                        }}>
                                            BONUS100
                                        </span>
                                    </div>
                                </div>

                                <div style={{ height: 8 }} />

                                <div className="checkbox-row">
                                    <input
                                        type="checkbox"
                                        id="age-check"
                                        checked={regAge}
                                        onChange={e => setRegAge(e.target.checked)}
                                    />
                                    <label htmlFor="age-check">
                                        I confirm I am <strong style={{ color: 'rgba(212,175,55,0.7)' }}>18 years of age or older</strong> and gambling is legal in my jurisdiction
                                    </label>
                                </div>

                                <div className="checkbox-row">
                                    <input
                                        type="checkbox"
                                        id="terms-check"
                                        checked={regTerms}
                                        onChange={e => setRegTerms(e.target.checked)}
                                    />
                                    <label htmlFor="terms-check">
                                        I accept the <a href="#terms">Terms of Service</a>, <a href="#privacy">Privacy Policy</a>, and <a href="#bonus">Bonus Rules</a>
                                    </label>
                                </div>

                                <div style={{ height: 6 }} />

                                <button type="submit" className="spin-btn">
                                    ✦ Create Account & Claim $100
                                </button>

                                <div className="or-divider">or</div>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        onLogin({ email: 'guest@mkcasino.io', username: 'Guest', balance: 50, isGuest: true });
                                        history.push('/');
                                    }}
                                >
                                    👤 Continue as Guest ($50 Demo)
                                </button>
                            </form>
                        )
                    )}

                    {/* ══ LOGIN TAB ══ */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin}>
                            {error && <div className="error-msg">{error}</div>}

                            <div className="form-field">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={loginEmail}
                                    onChange={e => { setLoginEmail(e.target.value); setError(''); }}
                                />
                            </div>

                            <div className="form-field">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={e => { setLoginPassword(e.target.value); setError(''); }}
                                />
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -8 }}>
                                <a href="#reset" style={{ fontSize: '0.78rem', color: 'rgba(212,175,55,0.45)' }}>
                                    Forgot password?
                                </a>
                            </div>

                            <button type="submit" className="spin-btn" style={{ marginBottom: 10 }}>
                                Login to Play
                            </button>

                            <div className="or-divider">or</div>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    onLogin({ email: 'guest@mkcasino.io', username: 'Guest', balance: 50, isGuest: true });
                                    history.push('/');
                                }}
                            >
                                👤 Continue as Guest ($50 Demo)
                            </button>

                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(212,175,55,0.35)' }}>
                                    No account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setTab('register')}
                                        style={{ background: 'none', border: 'none', color: 'var(--gold-mid)', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Poppins, sans-serif' }}
                                    >
                                        Register for $100 free →
                                    </button>
                                </span>
                            </div>
                        </form>
                    )}

                    {/* ══ DEPOSIT TAB ══ */}
                    {tab === 'deposit' && (
                        <div>
                            <div style={{
                                background: 'rgba(38,161,123,0.08)',
                                border: '1px solid rgba(38,161,123,0.3)',
                                borderRadius: 14,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 22,
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>💎</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#2ECC9F' }}>Minimum deposit: 10 USDT</div>
                                    <div style={{ fontSize: '0.74rem', color: 'rgba(208,201,184,0.5)' }}>Credited after 1 network confirmation</div>
                                </div>
                            </div>

                            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                                Casino Wallet (USDT TRC-20)
                            </label>
                            <div className="deposit-address-box">{CASINO_WALLET}</div>
                            <button className="copy-btn" onClick={copyAddress} style={{ marginBottom: 20 }}>
                                {copied ? '✅ Copied to clipboard!' : '📋 Copy Wallet Address'}
                            </button>

                            <div className="deposit-steps">
                                {[
                                    'Open your wallet app (Trust Wallet, Binance, etc.)',
                                    'Select USDT on the TRON (TRC-20) network',
                                    `Send minimum ${10} USDT to the address above`,
                                    'Balance credited after 1 block confirmation',
                                ].map((text, i) => (
                                    <div key={i} className="deposit-step">
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-text">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(231,76,60,0.05)',
                                border: '1px solid rgba(231,76,60,0.2)',
                                borderRadius: 12,
                                fontSize: '0.76rem',
                                color: 'rgba(208,201,184,0.6)',
                                marginBottom: 20,
                            }}>
                                ⚠️ Only send <strong style={{ color: '#E74C3C' }}>USDT TRC-20</strong>. Sending other assets will result in permanent loss.
                            </div>

                            <button className="spin-btn" onClick={() => setTab('register')}>
                                Register to Start Playing →
                            </button>
                        </div>
                    )}

                    <div className="login-footer">
                        🔒 256-bit SSL Encrypted &nbsp;·&nbsp; 18+ Only &nbsp;·&nbsp; Play Responsibly
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
