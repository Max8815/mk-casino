import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ usdtBalance, onDeposit }) => {
    const handleDeposit = () => {
        if (onDeposit) onDeposit();
    };

    return (
        <div className="header">
            <div className="header-content">
                <div className="header-left">
                    <Link to="/" className="brand-logo">
                        <span className="logo-icon">🎰</span>
                        <span>MK Casino</span>
                    </Link>
                </div>

                <div className="header-right">
                    <div className="usdt-balance-badge">
                        <span className="usdt-dot"></span>
                        <span>{Number(usdtBalance || 1000).toFixed(2)} USDT</span>
                    </div>

                    <button className="btn-deposit" onClick={handleDeposit}>
                        + Deposit
                    </button>

                    <div className="user-avatar">MK</div>
                </div>
            </div>
        </div>
    );
};

export default Header;
