import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Roulette from './pages/roulette';
import Wallet from './pages/wallet';
import History from './pages/history';

const Router = () => {
    return (
        <BrowserRouter>
            <div id="main-wrapper">
                <Switch>
                    <Route path="/" exact component={Dashboard} />
                    <Route path="/roulette" component={Roulette} />
                    <Route path="/wallet" component={Wallet} />
                    <Route path="/history" component={History} />
                </Switch>
            </div>
        </BrowserRouter>
    );
};

export default Router;
