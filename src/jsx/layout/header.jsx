import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ usdtBalance, onDeposit, user, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const isWallet = user?.authType === 'wallet' && user?.walletAddress;
    const displayName = isWallet
        ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`
        : (user?.username || 'MK');

    const initials = isWallet
        ? displayName.slice(0, 2).toUpperCase()
        : (user?.username ? user.username.slice(0, 2).toUpperCase() : 'MK');

    return (
        <div className="header">
            <div className="header-content">
                <div className="header-left">
                    <Link to="/" className="brand-logo">
                        <span className="logo-icon">MK</span>
                        <span>CASINO</span>
                    </Link>
                </div>

                <div className="header-right">
                    <div className="usdt-balance-badge">
                        <span className="usdt-dot" />
                        <span>{Number(usdtBalance ?? 0).toFixed(2)} USDT</span>
                    </div>

                    <button className="btn-deposit" onClick={onDeposit}>
                        Deposit
                    </button>

                    {/* Avatar / user menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="user-avatar"
                            title={displayName}
                            onClick={() => setMenuOpen(o => !o)}
                            style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                        >
                            {initials}
                        </button>

                        {menuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    background: 'var(--card)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', minWidth: 210,
                                    zIndex: 100, overflow: 'hidden',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}>
                                    {/* Identity block */}
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }}>
                                            {isWallet ? 'Connected Wallet' : 'Account'}
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--white)', fontWeight: 600, wordBreak: 'break-all' }}>
                                            {isWallet ? user.walletAddress : user?.username}
                                        </div>
                                        {isWallet && (
                                            <div style={{
                                                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                                                fontSize: '0.65rem', color: '#4ade80',
                                                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                                                borderRadius: 20, padding: '2px 8px',
                                            }}>
                                                <span style={{ width: 5, height: 5, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
                                                Wallet connected
                                            </div>
                                        )}
                                    </div>

                                    {/* Menu items */}
                                    <div style={{ padding: '6px 0' }}>
                                        <Link
                                            to="/history"
                                            onClick={() => setMenuOpen(false)}
                                            style={{
                                                display: 'block', padding: '9px 16px',
                                                fontSize: '0.82rem', color: 'var(--white)',
                                                textDecoration: 'none', fontWeight: 600,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Game History
                                        </Link>
                                        <Link
                                            to="/wallet"
                                            onClick={() => setMenuOpen(false)}
                                            style={{
                                                display: 'block', padding: '9px 16px',
                                                fontSize: '0.82rem', color: 'var(--white)',
                                                textDecoration: 'none', fontWeight: 600,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Wallet
                                        </Link>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                                        <button
                                            onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '9px 16px', background: 'none', border: 'none',
                                                fontSize: '0.82rem', color: '#ff6b6b', cursor: 'pointer',
                                                fontWeight: 600, fontFamily: 'var(--font)',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,0,15,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {isWallet ? 'Disconnect Wallet' : 'Log Out'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
