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
                    <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#fff' }}>💰 Wallet</h3>

                    <div className="stats-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-label">Available Balance</div>
                            <div className="stat-value usdt">{balance.toFixed(2)} USDT</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Deposited</div>
                            <div className="stat-value">1,000.00 USDT</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Withdrawn</div>
                            <div className="stat-value">0.00 USDT</div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-xl-5">
                            <div className="card mb-3">
                                <div className="card-header"><h4>Deposit USDT (TRC-20)</h4></div>
                                <div className="card-body">
                                    <p className="text-muted fs-sm mb-3">
                                        Send USDT on the TRON network to this address:
                                    </p>
                                    <div className="deposit-address-box">
                                        TGBtzWDkAAfWKqmH9YJEomtHtFZNgXAb7K
                                    </div>
                                    <button className="copy-btn" onClick={copyAddress}>
                                        {copied ? '✅ Copied!' : '📋 Copy Address'}
                                    </button>
                                    <div style={{
                                        marginTop: 14,
                                        padding: 12,
                                        background: 'rgba(201,168,76,0.06)',
                                        border: '1px solid rgba(201,168,76,0.2)',
                                        borderRadius: 10,
                                        fontSize: '0.78rem',
                                        color: 'var(--text-muted)',
                                    }}>
                                        ⚠️ Only send <strong style={{ color: 'var(--primary)' }}>USDT TRC-20</strong>.
                                        Min deposit: <strong>10 USDT</strong>. Confirmations: 20 blocks.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-5">
                            <div className="card mb-3">
                                <div className="card-header"><h4>Withdraw USDT</h4></div>
                                <div className="card-body">
                                    <p className="text-muted fs-sm mb-3">Withdraw to your external wallet.</p>
                                    <div className="amount-input-wrapper mb-3">
                                        <span className="amount-currency">USDT</span>
                                        <input
                                            type="number"
                                            className="amount-input"
                                            placeholder="Amount"
                                            min="10"
                                        />
                                    </div>
                                    <div className="amount-input-wrapper" style={{ marginBottom: 16 }}>
                                        <span className="amount-currency" style={{ fontSize: '0.72rem', padding: '0 10px' }}>TRC-20</span>
                                        <input
                                            type="text"
                                            className="amount-input"
                                            placeholder="Your USDT wallet address"
                                            style={{ fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <button style={{
                                        width: '100%', padding: '12px', borderRadius: 10,
                                        border: '1.5px solid var(--usdt)',
                                        background: 'rgba(38,161,123,0.1)',
                                        color: 'var(--usdt)', fontWeight: 700,
                                        fontSize: '0.9rem', cursor: 'pointer',
                                        fontFamily: 'Poppins, sans-serif',
                                    }}>
                                        Request Withdrawal
                                    </button>
                                    <p className="text-muted fs-sm mt-2 mb-0" style={{ marginTop: 10 }}>
                                        Min withdrawal: 10 USDT · Fee: 1 USDT
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
