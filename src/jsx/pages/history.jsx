import React from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const History = () => {
    return (
        <>
            <Sidebar />
            <Header usdtBalance={1000} />
            <div className="content-body">
                <div className="content-inner">
                    <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#fff' }}>📜 Game History</h3>

                    <div className="card">
                        <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎰</div>
                            <h4 style={{ color: '#fff', marginBottom: 8 }}>No games played yet</h4>
                            <p className="text-muted fs-sm">
                                Your game history will appear here after you play.
                            </p>
                            <a href="/roulette" style={{
                                display: 'inline-block', marginTop: 16,
                                padding: '12px 28px',
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                borderRadius: 10, color: '#000', fontWeight: 700,
                                textDecoration: 'none',
                            }}>
                                🎡 Play Roulette
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default History;
