import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '../layout/header';
import Sidebar from '../layout/sidebar';
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

const GRID_SIZE = 5;
const MINE_COUNT = 10;
const MULTIPLIERS = [1, 1.5, 2, 3, 5, 10];
const MULTIPLIER_THRESHOLD = 3; // Each 3 safe cells increases multiplier

// Deep copy helper for nested arrays
function deepCloneBoard(board) {
  return board.map(row => row.map(cell => ({ ...cell })));
}

// Create board with deterministic mine placement (provably fair)
function createBoard(seed, seedHash, offset = 0) {
  const board = Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => ({ isMine: false, revealed: false, flagged: false }))
  );

  // Use seed to deterministically place mines
  // We'll use simple hash-based placement for fairness
  for (let i = 0; i < MINE_COUNT; i++) {
    let placed = false;
    let attempt = 0;
    while (!placed && attempt < 100) {
      // Create unique hash for each attempt
      const attemptHash = seedHash.substring((i * 8 + attempt * 2) % (seedHash.length - 8), (i * 8 + attempt * 2 + 8) % seedHash.length);
      const val1 = parseInt(attemptHash.substring(0, 4), 16) % GRID_SIZE;
      const val2 = parseInt(attemptHash.substring(4, 8), 16) % GRID_SIZE;
      
      if (!board[val1][val2].isMine) {
        board[val1][val2].isMine = true;
        placed = true;
      }
      attempt++;
    }
  }
  return board;
}

function countAdjacentMines(board, row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc].isMine) count++;
    }
  }
  return count;
}

export default function Minesweeper({ user = {}, onLogout } = {}) {
  const [board, setBoard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [betAmount] = useState(10);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [cashOut, setCashOut] = useState(null);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(user?.balance || 1000);
  const [isInitializing, setIsInitializing] = useState(false); // FIX: Prevent race conditions

  // Provably fair state
  const [serverSeed, setServerSeed] = useState('');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState(() => generateRandomHex(8));
  const [nonce, setNonce] = useState(0);

  // Initialize server seed
  useEffect(() => {
    newServerSeed().then(({ serverSeed: s, serverSeedHash: h }) => {
      setServerSeed(s);
      setServerSeedHash(h);
    });
  }, []);

  // Memoized styles to avoid re-creation on every render
  const statusStyles = useMemo(() => ({
    container: {
      background: '#111',
      border: '1px solid #333',
      borderRadius: 8,
      padding: 20,
      marginBottom: 24,
      fontFamily: 'monospace',
      display: 'flex',
      gap: 32,
      flexWrap: 'wrap',
    },
    section: {
      minWidth: 100,
    },
    label: {
      color: '#666',
      fontSize: '0.75rem',
      marginBottom: 4,
    },
    value: {
      color: '#fff',
      fontSize: '1.2rem',
      fontWeight: 'bold',
    },
  }), []);

  // FIX: Proper async game initialization with race condition prevention
  const startGame = useCallback(async (row, col) => {
    if (isInitializing) return; // Prevent double-click races
    
    setIsInitializing(true);
    
    try {
      // Use provably fair to create the board
      const hash = await deriveHash(serverSeed, clientSeed, nonce);
      const newBoard = createBoard(serverSeed, hash, 0);
      
      // Verify first click is safe
      if (newBoard[row][col].isMine) {
        // Regenerate board until first click is safe
        let attempts = 0;
        while (newBoard[row][col].isMine && attempts < 10) {
          const retryHash = await deriveHash(serverSeed, clientSeed, nonce + attempts + 1);
          newBoard = createBoard(serverSeed, retryHash, 0);
          attempts++;
        }
      }
      
      newBoard[row][col].revealed = true;
      
      // FIX: Set all state synchronously after async operation completes
      setBoard(newBoard);
      setGameOver(false);
      setWon(false);
      setRevealedCount(1);
      setCurrentMultiplier(1);
      setCashOut(null);
    } finally {
      setIsInitializing(false);
    }
  }, [serverSeed, clientSeed, nonce, isInitializing]);

  const handleCellClick = useCallback((row, col) => {
    // FIX: Better validation - check board exists and cell is not revealed
    if (!board || gameOver || board[row][col].revealed || cashOut !== null || isInitializing) {
      return;
    }

    const newBoard = deepCloneBoard(board);
    newBoard[row][col].revealed = true;

    if (newBoard[row][col].isMine) {
      // Reveal all mines on hit
      newBoard.forEach((r, ri) => r.forEach((c, ci) => {
        if (c.isMine) newBoard[ri][ci].revealed = true;
      }));
      setBoard(newBoard);
      setGameOver(true);
      setCashOut(0);
      setBalance(prev => +(prev - betAmount).toFixed(2));
      
      // FIX: Add loss to history
      setHistory(prev => [{
        id: Date.now(),
        revealed: revealedCount,
        bet: betAmount,
        multiplier: currentMultiplier,
        payout: 0,
        profit: -betAmount,
        result: 'lost',
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
      return;
    }

    const newRevealed = revealedCount + 1;
    const totalSafeCells = GRID_SIZE * GRID_SIZE - MINE_COUNT;
    
    // FIX: Correct multiplier calculation based on revealed safe cells
    const multiplierIndex = Math.min(Math.floor((newRevealed - 1) / MULTIPLIER_THRESHOLD), MULTIPLIERS.length - 1);
    const newMultiplier = MULTIPLIERS[multiplierIndex];
    const newCashOut = +(betAmount * newMultiplier).toFixed(2);

    setBoard(newBoard);
    setRevealedCount(newRevealed);
    setCurrentMultiplier(newMultiplier);
    setCashOut(newCashOut);

    // FIX: Auto-win if all safe cells revealed
    if (newRevealed === totalSafeCells) {
      setGameOver(true);
      setWon(true);
      setBalance(prev => +(prev + newCashOut).toFixed(2));
      
      setHistory(prev => [{
        id: Date.now(),
        revealed: newRevealed,
        bet: betAmount,
        multiplier: newMultiplier,
        payout: newCashOut,
        profit: +(newCashOut - betAmount).toFixed(2),
        result: 'won',
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
    }
  }, [board, gameOver, cashOut, revealedCount, betAmount, currentMultiplier, isInitializing]);

  const handleCashOut = useCallback(() => {
    if (!cashOut || cashOut === null) return;
    
    setGameOver(true);
    setWon(true);
    setBalance(prev => +(prev + cashOut).toFixed(2));
    
    setHistory(prev => [{
      id: Date.now(),
      revealed: revealedCount,
      bet: betAmount,
      multiplier: currentMultiplier,
      payout: cashOut,
      profit: +(cashOut - betAmount).toFixed(2),
      result: 'won',
      time: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 20));
  }, [cashOut, revealedCount, betAmount, currentMultiplier]);

  const resetGame = useCallback(() => {
    setBoard(null);
    setGameOver(false);
    setWon(false);
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setCashOut(null);
    setNonce(n => n + 1);
    setIsInitializing(false);
  }, []);

  const totalRevealed = GRID_SIZE * GRID_SIZE - MINE_COUNT;

  return (
    <>
      <Sidebar />
      <Header user={user} onLogout={onLogout} usdtBalance={balance} />
      <div className="content-body">
        <div className="content-inner">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 24, color: '#00FF41' }}>
            💣 Minesweeper
          </h2>

          {/* Status */}
          <div style={statusStyles.container}>
            <div style={statusStyles.section}>
              <div style={statusStyles.label}>BET</div>
              <div style={statusStyles.value}>{betAmount} USDT</div>
            </div>
            <div style={statusStyles.section}>
              <div style={statusStyles.label}>MULTIPLIER</div>
              <div style={{ ...statusStyles.value, color: '#00FF41' }}>{currentMultiplier.toFixed(1)}x</div>
            </div>
            <div style={statusStyles.section}>
              <div style={statusStyles.label}>CASH OUT</div>
              <div style={{ ...statusStyles.value, color: cashOut !== null ? '#FFD700' : '#666' }}>
                {cashOut !== null ? `${cashOut.toFixed(2)} USDT` : '—'}
              </div>
            </div>
            <div style={statusStyles.section}>
              <div style={statusStyles.label}>CELLS LEFT</div>
              <div style={statusStyles.value}>
                {board ? `${totalRevealed - revealedCount}` : totalRevealed}
              </div>
            </div>
          </div>

          {/* Game Over Banner */}
          {gameOver && (
            <div style={{
              background: won ? 'linear-gradient(135deg, #00FF41 0%, #00cc33 100%)' : 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              borderRadius: 8,
              padding: '16px 24px',
              marginBottom: 24,
              textAlign: 'center',
              animation: 'pulse 0.5s ease'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>
                {won ? `🎉 YOU WON ${cashOut.toFixed(2)} USDT!` : '💥 GAME OVER - MINE HIT'}
              </div>
            </div>
          )}

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: 6,
            maxWidth: 400,
            margin: '0 auto 24px'
          }}>
            {board ? board.map((row, ri) =>
              row.map((cell, ci) => {
                const adjacent = countAdjacentMines(board, ri, ci);
                const bgColor = cell.revealed
                  ? cell.isMine ? '#ff4444' : '#1a1a1a'
                  : '#222';
                const borderColor = cell.revealed ? '#333' : '#444';
                const adjacentColor = ['#fff', '#00FF41', '#FFD700', '#ff8800', '#ff4444', '#00ccff'][adjacent];

                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => handleCellClick(ri, ci)}
                    disabled={gameOver || cell.revealed || isInitializing}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 6,
                      cursor: (gameOver || cell.revealed || isInitializing) ? 'default' : 'pointer',
                      fontSize: '1.2rem',
                      fontFamily: 'monospace',
                      transition: 'all 0.15s ease',
                      transform: cell.revealed ? 'scale(0.95)' : 'scale(1)',
                      boxShadow: cell.revealed ? 'none' : '0 2px 8px rgba(0,255,65,0.2)',
                      color: adjacentColor,
                      fontWeight: 'bold',
                    }}
                  >
                    {cell.revealed && !cell.isMine && adjacent > 0 && adjacent}
                    {cell.revealed && !cell.isMine && adjacent === 0 && ' '}
                    {cell.revealed && cell.isMine && '💣'}
                  </button>
                );
              })
            ) : (
              Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => (
                <button
                  key={i}
                  onClick={() => startGame(Math.floor(i / GRID_SIZE), i % GRID_SIZE)}
                  disabled={isInitializing}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: '#222',
                    border: '2px solid #444',
                    borderRadius: 6,
                    cursor: isInitializing ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    color: '#666',
                    fontFamily: 'monospace',
                    transition: 'all 0.15s ease',
                    opacity: isInitializing ? 0.5 : 1,
                  }}
                >
                  {isInitializing ? '...' : 'TAP'}
                </button>
              ))
            )}
          </div>

          {/* Cash Out Button */}
          {board && !gameOver && cashOut !== null && (
            <button
              onClick={handleCashOut}
              disabled={isInitializing}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 400,
                margin: '0 auto',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: 'none',
                borderRadius: 8,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#000',
                cursor: isInitializing ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                transition: 'transform 0.15s ease',
                boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
                opacity: isInitializing ? 0.6 : 1,
              }}
            >
              CASH OUT {cashOut.toFixed(2)} USDT
            </button>
          )}

          {gameOver && (
            <button
              onClick={resetGame}
              disabled={isInitializing}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 400,
                margin: '0 auto',
                padding: '16px 32px',
                background: '#00FF41',
                border: 'none',
                borderRadius: 8,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#000',
                cursor: isInitializing ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                opacity: isInitializing ? 0.6 : 1,
              }}
            >
              NEW GAME
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: 32, background: '#111', border: '1px solid #333', borderRadius: 8, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#aaa' }}>Recent Games</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 10).map((game) => (
                  <div key={game.id} style={{
                    background: '#1a1a1a',
                    border: `1px solid ${game.result === 'won' ? 'rgba(0,255,65,0.3)' : 'rgba(255,68,68,0.3)'}`,
                    borderRadius: 4,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                  }}>
                    <div>
                      <span style={{ color: '#aaa' }}>{game.time}</span>
                      <span style={{ margin: '0 12px', color: '#666' }}>·</span>
                      <span style={{ color: game.result === 'won' ? '#00FF41' : '#ff4444', fontWeight: 'bold' }}>
                        {game.result === 'won' ? `${game.revealed} safe cells` : 'BUSTED'}
                      </span>
                    </div>
                    <span style={{ color: game.profit >= 0 ? '#00FF41' : '#ff4444', fontWeight: 'bold' }}>
                      {game.profit >= 0 ? '+' : ''}{game.profit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
            button:disabled {
              cursor: not-allowed;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
