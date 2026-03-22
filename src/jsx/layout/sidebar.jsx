import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
    { to: '/', icon: '●', label: 'Home' },
    { to: '/roulette', icon: '◉', label: 'Roulette' },
    { to: '/slots', icon: '◆', label: 'Slots' },
    { to: '/erotic-slots', icon: '♥', label: 'Erotic' },
    { to: '/wallet', icon: '▲', label: 'Wallet' },
    { to: '/history', icon: '■', label: 'History' },
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="sidebar-logo" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>MK</div>

            <nav>
                <ul>
                    {NAV.map(item => (
                        <li key={item.to}>
                            <Link
                                to={item.to}
                                className={location.pathname === item.to ? 'active' : ''}
                                title={item.label}
                            >
                                <span style={{ fontSize: '1.1rem', color: location.pathname === item.to ? 'var(--white)' : 'inherit' }}>{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-bottom">
                <Link to="/settings" title="Settings" style={{ fontSize: '0.9rem' }}>◇</Link>
            </div>
        </div>
    );
};

export default Sidebar;
