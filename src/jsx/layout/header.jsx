import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ usdtBalance, onDeposit, username }) => {
    const initials = username ? username.slice(0, 2).toUpperCase() : 'MK';

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

                    <div className="user-avatar" title={username}>{initials}</div>
                </div>
            </div>
        </div>
    );
};

export default Header;
