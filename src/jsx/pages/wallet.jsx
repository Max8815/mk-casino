import React, { useState } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const Wallet = () => {
    const [balance] = useState(1000);
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        navigator.clipboard.writeText('TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Sidebar />
            <Header usdtBalance={balance} />
            <div className="content-body">
                <div className="content-inner">
                    <h3 style={{ margin: '0 0 24px', fontWeight: 800, color: 'var(--white)' }}>Wallet</h3>

                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card">
                            <div className="stat-label">Available</div>
                            <div className="stat-value usdt">{balance.toFixed(2)} USDT</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Deposited</div>
                            <div className="stat-value">{balance.toFixed(2)} USDT</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Withdrawn</div>
                            <div className="stat-value">0.00 USDT</div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-xl-5">
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div className="card-header"><h4>Deposit USDT</h4></div>
                                <div className="card-body">
                                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 12 }}>
                                        Send USDT on TRON (TRC-20):
                                    </p>
                                    <div className="deposit-address-box">TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K</div>
                                    <button className="copy-btn" onClick={copyAddress}>
                                        {copied ? 'Copied!' : 'Copy Address'}
                                    </button>
                                    <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--muted)' }}>
                                        Only USDT TRC-20 · Min: <strong style={{ color: 'var(--white)' }}>10 USDT</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-5">
                            <div className="card">
                                <div className="card-header"><h4>Withdraw USDT</h4></div>
                                <div className="card-body">
                                    <div className="amount-input-wrapper mb-3">
                                        <span className="amount-currency">USDT</span>
                                        <input type="number" className="amount-input" placeholder="Amount" min="10" />
                                    </div>
                                    <div className="amount-input-wrapper" style={{ marginBottom: 14 }}>
                                        <span className="amount-currency" style={{ fontSize: '0.72rem' }}>TRC-20</span>
                                        <input type="text" className="amount-input" placeholder="Your wallet address" style={{ fontSize: '0.82rem' }} />
                                    </div>
                                    <button style={{
                                        width: '100%', padding: '11px', borderRadius: 'var(--radius)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--white)', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: 'pointer', fontFamily: 'var(--font)',
                                    }}>
                                        Withdraw
                                    </button>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 10, marginBottom: 0 }}>
                                        Min: 10 USDT · Fee: 1 USDT
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Wallet;
