import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const STORAGE_KEY = 'mk_wallet_connection';

const SIGN_MESSAGE = (nonce) =>
    `Welcome to MK Casino!\n\nClick "Sign" to verify ownership of this wallet.\nThis is free — it does not trigger a blockchain transaction.\n\nNonce: ${nonce}`;

const randomNonce = () => Math.random().toString(36).slice(2, 12);

// ─── WalletConnect provider (lazy-loaded) ─────────────────────────────────────
let _wcProvider = null;
async function getWCProvider() {
    if (_wcProvider) return _wcProvider;
    const { default: EthereumProvider } = await import('@walletconnect/ethereum-provider');
    _wcProvider = await EthereumProvider.init({
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [1],          // Ethereum mainnet
        optionalChains: [56, 137, 8453], // BSC, Polygon, Base
        showQrModal: true,
    });
    return _wcProvider;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
    const [address, setAddress]     = useState(null);
    const [provider, setProvider]   = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError]         = useState(null);

    // ── Auto-reconnect on page load ──────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const { type, address: savedAddress } = JSON.parse(saved);

        if (type === 'metamask' && window.ethereum) {
            // Re-request silently (no popup if already connected)
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                if (accounts[0]?.toLowerCase() === savedAddress.toLowerCase()) {
                    const web3 = new ethers.providers.Web3Provider(window.ethereum);
                    setProvider(web3);
                    setAddress(savedAddress);
                }
            }).catch(() => {});
        }
        // WalletConnect auto-reconnect is handled by its own session persistence
    }, []);

    // ── MetaMask ─────────────────────────────────────────────────────────────
    const connectMetaMask = useCallback(async () => {
        setError(null);
        setConnecting(true);
        try {
            if (!window.ethereum) throw new Error('MetaMask is not installed. Install it from metamask.io');

            const web3 = new ethers.providers.Web3Provider(window.ethereum);
            await web3.send('eth_requestAccounts', []);
            const signer = web3.getSigner();
            const addr   = await signer.getAddress();

            // Sign to prove ownership
            const nonce = randomNonce();
            const sig   = await signer.signMessage(SIGN_MESSAGE(nonce));
            const recovered = ethers.utils.verifyMessage(SIGN_MESSAGE(nonce), sig);
            if (recovered.toLowerCase() !== addr.toLowerCase()) throw new Error('Signature verification failed');

            setProvider(web3);
            setAddress(addr);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'metamask', address: addr }));

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) disconnect();
                else setAddress(accounts[0]);
            });

            return addr;
        } catch (err) {
            setError(err.message || 'MetaMask connection failed');
            throw err;
        } finally {
            setConnecting(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── WalletConnect ─────────────────────────────────────────────────────────
    const connectWalletConnect = useCallback(async () => {
        setError(null);
        setConnecting(true);
        try {
            const wcProvider = await getWCProvider();
            await wcProvider.connect();

            const web3  = new ethers.providers.Web3Provider(wcProvider);
            const signer = web3.getSigner();
            const addr   = await signer.getAddress();

            // Sign to prove ownership
            const nonce = randomNonce();
            const sig   = await signer.signMessage(SIGN_MESSAGE(nonce));
            const recovered = ethers.utils.verifyMessage(SIGN_MESSAGE(nonce), sig);
            if (recovered.toLowerCase() !== addr.toLowerCase()) throw new Error('Signature verification failed');

            setProvider(web3);
            setAddress(addr);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'walletconnect', address: addr }));

            wcProvider.on('disconnect', () => disconnect());

            return addr;
        } catch (err) {
            setError(err.message || 'WalletConnect connection failed');
            throw err;
        } finally {
            setConnecting(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Disconnect ────────────────────────────────────────────────────────────
    const disconnect = useCallback(async () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const { type } = JSON.parse(saved);
            if (type === 'walletconnect' && _wcProvider) {
                try { await _wcProvider.disconnect(); } catch {}
                _wcProvider = null;
            }
        }
        localStorage.removeItem(STORAGE_KEY);
        setAddress(null);
        setProvider(null);
        setError(null);
    }, []);

    return {
        address,
        provider,
        connecting,
        error,
        isConnected: !!address,
        connectMetaMask,
        connectWalletConnect,
        disconnect,
        shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
    };
}
