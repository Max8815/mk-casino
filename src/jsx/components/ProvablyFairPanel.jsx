import React, { useState } from 'react';
import { verifyOutcome } from '../../utils/provablyFair';

/**
 * Reusable Provably Fair panel.
 *
 * Props:
 *   game            'roulette' | 'slots' | 'dice'
 *   serverSeedHash  SHA-256 of the current server seed (shown before spin)
 *   clientSeed      current client seed string
 *   onClientSeedChange  (newSeed: string) => void
 *   nonce           current game count
 *   lastGame        null | { serverSeed, clientSeed, nonce, outcome, poolSize? }
 */
const ProvablyFairPanel = ({ game, serverSeedHash, clientSeed, onClientSeedChange, nonce, lastGame }) => {
    const [open, setOpen] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(null);

    const handleVerify = async () => {
        if (!lastGame) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const result = await verifyOutcome(
                game,
                lastGame.serverSeed,
                lastGame.clientSeed,
                lastGame.nonce,
                lastGame.outcome,
                lastGame.poolSize,
            );
            setVerifyResult(result);
        } catch (e) {
            setVerifyResult({ error: e.message });
        }
        setVerifying(false);
    };

    const copy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const panelStyle = {
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginTop: 20,
        background: 'var(--card)',
    };
    const headerStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
        borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
    };
    const labelStyle = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 };
    const valueStyle = {
        fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--white)',
        wordBreak: 'break-all', background: 'var(--card2)',
        border: '1px solid var(--border)', borderRadius: 6,
        padding: '6px 10px', position: 'relative',
    };
    const copyBtn = (text, key) => (
        <button
            onClick={() => copy(text, key)}
            style={{
                position: 'absolute', top: 4, right: 4,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 4, color: 'var(--muted)', cursor: 'pointer',
                fontSize: '0.65rem', padding: '2px 6px', fontFamily: 'var(--font)',
            }}
        >
            {copied === key ? 'Copied' : 'Copy'}
        </button>
    );

    const field = (label, value, key) => (
        <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>{label}</div>
            <div style={{ ...valueStyle, paddingRight: 60 }}>
                {value}
                {copyBtn(value, key)}
            </div>
        </div>
    );

    return (
        <div style={panelStyle}>
            <div style={headerStyle} onClick={() => setOpen(o => !o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🔒</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--white)' }}>Provably Fair</span>
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px',
                        borderRadius: 20, background: 'rgba(232,0,15,0.12)',
                        border: '1px solid rgba(232,0,15,0.3)', color: '#ff6b6b',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Verifiable</span>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
            </div>

            {open && (
                <div style={{ padding: '16px 16px 20px' }}>

                    {/* Current round info */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                            Current Round — Nonce #{nonce}
                        </div>

                        {field('Server Seed Hash (SHA-256 commitment)', serverSeedHash, 'hash')}

                        <div style={{ marginBottom: 12 }}>
                            <div style={labelStyle}>Your Client Seed <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>(editable)</span></div>
                            <input
                                value={clientSeed}
                                onChange={e => onClientSeedChange(e.target.value)}
                                style={{
                                    width: '100%', background: 'var(--card2)',
                                    border: '1px solid var(--border)', borderRadius: 6,
                                    padding: '6px 10px', color: 'var(--white)',
                                    fontFamily: 'monospace', fontSize: '0.72rem',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                                placeholder="Enter your own seed for extra randomness"
                            />
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                            The server seed is hashed and locked before you spin. After the game, the real seed is revealed so you can verify the outcome yourself.
                        </div>
                    </div>

                    {/* Verification of last game */}
                    {lastGame && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                                Last Game — Nonce #{lastGame.nonce}
                            </div>

                            {field('Revealed Server Seed', lastGame.serverSeed, 'revealed')}
                            {field('Client Seed Used', lastGame.clientSeed, 'cs')}

                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    style={{
                                        flex: 1, padding: '8px 0', borderRadius: 'var(--radius)',
                                        border: '1px solid rgba(232,0,15,0.4)',
                                        background: 'rgba(232,0,15,0.08)',
                                        color: 'var(--white)', fontWeight: 700, fontSize: '0.8rem',
                                        cursor: verifying ? 'wait' : 'pointer', fontFamily: 'var(--font)',
                                    }}
                                >
                                    {verifying ? 'Verifying…' : 'Verify Result'}
                                </button>
                            </div>

                            {verifyResult && !verifyResult.error && (
                                <div style={{
                                    marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius)',
                                    background: verifyResult.valid ? 'rgba(0,200,100,0.07)' : 'rgba(232,0,15,0.07)',
                                    border: `1px solid ${verifyResult.valid ? 'rgba(0,200,100,0.25)' : 'rgba(232,0,15,0.25)'}`,
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: verifyResult.valid ? '#4ade80' : '#ff6b6b', marginBottom: 6 }}>
                                        {verifyResult.valid ? '✓ Verified — outcome matches' : '✗ Mismatch — outcome differs'}
                                    </div>
                                    <div style={labelStyle}>Full Hash</div>
                                    <div style={{ ...valueStyle, fontSize: '0.65rem', paddingRight: 60, marginBottom: 8 }}>
                                        {verifyResult.hash}
                                        {copyBtn(verifyResult.hash, 'vhash')}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                        Derived outcome: <strong style={{ color: 'var(--white)' }}>
                                            {Array.isArray(verifyResult.derived) ? verifyResult.derived.join(', ') : verifyResult.derived}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            {verifyResult?.error && (
                                <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#ff6b6b' }}>
                                    Error: {verifyResult.error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* How it works */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 16 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>How to verify manually:</strong><br />
                            <code style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                hash = SHA-256(serverSeed + ":" + clientSeed + ":" + nonce)<br />
                                {game === 'roulette' && 'outcome = parseInt(hash[0..7], 16) % 37'}
                                {game === 'slots' && 'reel[i] = parseInt(hash[i*8..i*8+8], 16) % poolSize'}
                                {game === 'dice' && 'roll = (parseInt(hash[0..7], 16) % 100) + 1'}
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProvablyFairPanel;
