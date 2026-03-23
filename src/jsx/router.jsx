import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Roulette from './pages/roulette';
import Slots from './pages/slots';
import EroticSlots from './pages/erotic-slots';
import Wallet from './pages/wallet';
import History from './pages/history';
import Minesweeper from './pages/minesweeper';
import { getOrCreateWalletUser } from '../firebase/db';
import { useWallet } from '../wallet/useWallet';

const SESSION_KEY = 'mk_user_session';

const Router = () => {
    const [user, setUser] = useState(() => {
        // Rehydrate session from localStorage on page load
        try {
            const saved = localStorage.getItem(SESSION_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const { address: walletAddress, isConnected, disconnect } = useWallet();

    // If wallet auto-reconnected (MetaMask), sync user from Firestore
    useEffect(() => {
        if (walletAddress && !user) {
            getOrCreateWalletUser(walletAddress).then(userData => {
                const u = {
                    uid: walletAddress.toLowerCase(),
                    walletAddress,
                    username: userData.username,
                    balance: userData.balance ?? 100,
                    authType: 'wallet',
                };
                setUser(u);
                localStorage.setItem(SESSION_KEY, JSON.stringify(u));
            }).catch(() => {});
        }
    }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    };

    const handleLogout = async () => {
        if (isConnected) await disconnect();
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
    };

    const guard = (Component, extraProps = {}) =>
        user
            ? <Component user={user} onLogout={handleLogout} setUser={setUser} {...extraProps} />
            : <Redirect to="/login" />;

    return (
        <BrowserRouter>
            <div id="main-wrapper">
                <Switch>
                    <Route path="/login"         render={() => user ? <Redirect to="/" /> : <Login onLogin={handleLogin} />} />
                    <Route path="/"              exact render={() => guard(Dashboard)} />
                    <Route path="/roulette"      render={() => guard(Roulette)} />
                    <Route path="/slots"         render={() => guard(Slots)} />
                    <Route path="/erotic-slots"  render={() => guard(EroticSlots)} />
                    <Route path="/wallet"        render={() => guard(Wallet)} />
                    <Route path="/history"       render={() => guard(History)} />
                    <Route path="/minesweeper" render={() => guard(Minesweeper)} />
                    <Redirect to="/login" />
                </Switch>
            </div>
        </BrowserRouter>
    );
};

export default Router;
