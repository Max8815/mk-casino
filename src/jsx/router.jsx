import React, { useState } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Roulette from './pages/roulette';
import Slots from './pages/slots';
import Wallet from './pages/wallet';
import History from './pages/history';

const Router = () => {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <BrowserRouter>
            <div id="main-wrapper">
                <Switch>
                    <Route path="/login" render={() =>
                        user ? <Redirect to="/" /> : <Login onLogin={handleLogin} />
                    } />

                    <Route path="/" exact render={() =>
                        user ? <Dashboard user={user} onLogout={handleLogout} /> : <Redirect to="/login" />
                    } />
                    <Route path="/roulette" render={() =>
                        user ? <Roulette /> : <Redirect to="/login" />
                    } />
                    <Route path="/slots" render={() =>
                        user ? <Slots /> : <Redirect to="/login" />
                    } />
                    <Route path="/wallet" render={() =>
                        user ? <Wallet /> : <Redirect to="/login" />
                    } />
                    <Route path="/history" render={() =>
                        user ? <History /> : <Redirect to="/login" />
                    } />
                </Switch>
            </div>
        </BrowserRouter>
    );
};

export default Router;
