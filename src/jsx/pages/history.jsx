import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';

const History = () => {
    return (
        <>
            <Sidebar />
            <Header usdtBalance={1000} />
            <div className="content-body">
                <div className="content-inner">
                    <h3 style={{ margin: '0 0 24px', fontWeight: 800, color: 'var(--white)' }}>History</h3>

                    <div className="card">
                        <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: 0.4 }}>■</div>
                            <h4 style={{ color: 'var(--white)', marginBottom: 8, fontWeight: 700 }}>No games yet</h4>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 18 }}>
                                Your game history will appear here.
                            </p>
                            <Link to="/roulette" style={{
                                display: 'inline-block', padding: '10px 24px',
                                background: 'var(--red)', borderRadius: 'var(--radius)',
                                color: 'var(--white)', fontWeight: 700, fontSize: '0.82rem',
                                textDecoration: 'none',
                            }}>
                                Play Roulette
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default History;
