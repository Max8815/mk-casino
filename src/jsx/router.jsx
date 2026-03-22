import React, { useState } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Roulette from './pages/roulette';
import Slots from './pages/slots';
import EroticSlots from './pages/erotic-slots';
import Wallet from './pages/wallet';
import History from './pages/history';

const Router = () => {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => setUser(userData);
    const handleLogout = () => setUser(null);

    const guard = (Component, extraProps = {}) =>
        user
            ? <Component user={user} onLogout={handleLogout} {...extraProps} />
            : <Redirect to="/login" />;

    return (
        <BrowserRouter>
            <div id="main-wrapper">
                <Switch>
                    <Route path="/login"    render={() => user ? <Redirect to="/" /> : <Login onLogin={handleLogin} />} />
                    <Route path="/"         exact render={() => guard(Dashboard)} />
                    <Route path="/roulette" render={() => guard(Roulette)} />
                    <Route path="/slots"         render={() => guard(Slots)} />
                    <Route path="/erotic-slots"  render={() => guard(EroticSlots)} />
                    <Route path="/wallet"        render={() => guard(Wallet)} />
                    <Route path="/history"  render={() => guard(History)} />
                    <Redirect to="/login" />
                </Switch>
            </div>
        </BrowserRouter>
    );
};

export default Router;
