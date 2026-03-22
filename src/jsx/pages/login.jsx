import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useWallet } from '../../wallet/useWallet';
import { getOrCreateWalletUser } from '../../firebase/db';

const CASINO_WALLET = 'TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K';

const Login = ({ onLogin }) => {
    const history = useHistory();
    const { connectMetaMask, connectWalletConnect, connecting, error: walletError } = useWallet();
    const [step, setStep] = useState('choose');   // 'choose' | 'connecting' | 'error'
    const [localError, setLocalError] = useState('');
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState('connect');    // 'connect' | 'deposit'

    const copyAddress = () => {
        navigator.clipboard.writeText(CASINO_WALLET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleConnect = async (connectFn) => {
        setLocalError('');
        setStep('connecting');
        try {
            const address = await connectFn();
            // Provision / fetch user in Firestore
            const userData = await getOrCreateWalletUser(address);
            onLogin({
                uid: address.toLowerCase(),
                walletAddress: address,
                username: userData.username,
                balance: userData.balance ?? 100,
                authType: 'wallet',
            });
            history.push('/');
        } catch (err) {
            const msg = err?.message || 'Connection failed';
            // User rejected — don't show scary error
            if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
                setStep('choose');
            } else {
                setLocalError(msg);
                setStep('error');
            }
        }
    };

    const displayError = localError || walletError;

    // ── Styles ─────────────────────────────────────────────────────────────────

    const walletBtnStyle = (disabled) => ({
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '14px 18px',
        background: 'var(--card2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', color: 'var(--white)',
        fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.92rem',
        cursor: disabled ? 'wait' : 'pointer', textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        opacity: disabled ? 0.6 : 1,
        marginBottom: 10,
    });

    const iconBox = {
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem',
    };

    return (
        <div className="login-page">

            {/* ── LEFT HERO ── */}
            <div className="login-hero">
                <div className="login-hero-content">
                    <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>MK</div>
                    <h1 className="hero-title">CASINO</h1>
                    <p className="hero-subtitle">Premium Crypto Gaming</p>

                    <div style={{
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                        padding: '20px 24px', marginBottom: 28, textAlign: 'left',
                    }}>
                        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>
                            Welcome Bonus
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--white)', marginBottom: 4 }}>
                            $100 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)' }}>USDT</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Free on first wallet connect</div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        {[
                            { title: 'No account needed', sub: 'Your wallet IS your account' },
                            { title: 'Provably Fair', sub: 'Every result verifiable on-chain' },
                            { title: 'Instant Payouts', sub: 'USDT TRC-20 withdrawals' },
                        ].map(f => (
                            <div key={f.title} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '10px 0', borderBottom: '1px solid var(--border)',
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ fontWeight: 700, color: 'var(--white)' }}>{f.title}</span>
                                <span style={{ color: 'var(--muted)' }}>{f.sub}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM ── */}
            <div className="login-form-side">
                <div className="login-form-inner">

                    <div className="login-logo">
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>MK CASINO</div>
                    </div>

                    {/* Tabs */}
                    <div className="form-tabs">
                        {[{ id: 'connect', label: 'Connect Wallet' }, { id: 'deposit', label: 'Deposit' }].map(t => (
                            <button key={t.id} className={`form-tab ${tab === t.id ? 'active' : ''}`}
                                onClick={() => setTab(t.id)}>{t.label}</button>
                        ))}
                    </div>

                    {/* ── CONNECT TAB ── */}
                    {tab === 'connect' && (
                        <>
                            {step === 'connecting' && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '16px', background: 'var(--card2)',
                                    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                                    marginBottom: 16, fontSize: '0.85rem', color: 'var(--muted)',
                                }}>
                                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                                    Waiting for wallet confirmation…
                                </div>
                            )}

                            {displayError && step === 'error' && (
                                <div className="error-msg" style={{ marginBottom: 14 }}>
                                    {displayError}
                                    <button onClick={() => setStep('choose')} style={{
                                        background: 'none', border: 'none', color: 'var(--red)',
                                        cursor: 'pointer', marginLeft: 8, fontSize: '0.8rem',
                                        fontFamily: 'var(--font)',
                                    }}>Try again</button>
                                </div>
                            )}

                            <div style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 14, fontWeight: 700 }}>
                                    Choose your wallet
                                </div>

                                {/* MetaMask */}
                                <button
                                    style={walletBtnStyle(connecting)}
                                    disabled={connecting}
                                    onClick={() => handleConnect(connectMetaMask)}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,0,15,0.5)'; e.currentTarget.style.background = 'rgba(232,0,15,0.04)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card2)'; }}
                                >
                                    <div style={{ ...iconBox, background: 'rgba(240,140,10,0.12)', border: '1px solid rgba(240,140,10,0.2)' }}>
                                        🦊
                                    </div>
                                    <div>
                                        <div>MetaMask</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400, marginTop: 1 }}>Browser extension / mobile</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.8rem' }}>→</span>
                                </button>

                                {/* WalletConnect */}
                                <button
                                    style={walletBtnStyle(connecting)}
                                    disabled={connecting}
                                    onClick={() => handleConnect(connectWalletConnect)}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,153,252,0.4)'; e.currentTarget.style.background = 'rgba(59,153,252,0.04)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card2)'; }}
                                >
                                    <div style={{ ...iconBox, background: 'rgba(59,153,252,0.1)', border: '1px solid rgba(59,153,252,0.2)' }}>
                                        🔗
                                    </div>
                                    <div>
                                        <div>WalletConnect</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400, marginTop: 1 }}>300+ wallets via QR code</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.8rem' }}>→</span>
                                </button>
                            </div>

                            {/* Info */}
                            <div style={{
                                padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius)',
                                fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: 4,
                            }}>
                                <strong style={{ color: 'rgba(255,255,255,0.45)' }}>How it works:</strong>{' '}
                                Connect your wallet and sign a free message to verify ownership.
                                No password, no email — your wallet address is your account.
                                New wallets receive a <strong style={{ color: 'var(--white)' }}>$100 USDT</strong> welcome bonus.
                            </div>

                            <div className="or-divider">or</div>

                            <button
                                type="button"
                                className="btn-secondary"
                                disabled={connecting}
                                onClick={() => {
                                    onLogin({ uid: 'guest', walletAddress: null, username: 'Guest', balance: 50, isGuest: true });
                                    history.push('/');
                                }}
                            >
                                Continue as Guest
                            </button>
                        </>
                    )}

                    {/* ── DEPOSIT TAB ── */}
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
                                    'Send min 10 USDT to the address above',
                                    'Balance credited after confirmation',
                                ].map((text, i) => (
                                    <div key={i} className="deposit-step">
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-text">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="spin-btn" onClick={() => setTab('connect')} style={{ marginTop: 8 }}>
                                Connect Wallet to Play →
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
