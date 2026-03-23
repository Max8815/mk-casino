'use client'
import React, { useState, useCallback, useEffect } from 'react'
import Header from '../layout/header'
import Sidebar from '../layout/sidebar'

const GRID_SIZE = 5
const MINE_COUNT = 10

const MULTIPLIERS = [1, 1.5, 2, 3, 5, 10]

function createBoard(safeRow, safeCol) {
  const board = Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill({ isMine: false, revealed: false, flagged: false })
  )

  // Place mines randomly, avoiding first click
  let placed = 0
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * GRID_SIZE)
    const c = Math.floor(Math.random() * GRID_SIZE)
    if (r === safeRow && c === safeCol) continue
    if (board[r][c].isMine) continue
    board[r][c].isMine = true
    placed++
  }
  return board
}

function countAdjacentMines(board, row, col) {
  let count = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr, nc = col + dc
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc].isMine) count++
    }
  }
  return count
}

export default function Minesweeper() {
  const [board, setBoard] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [betAmount] = useState(10)
  const [revealedCount, setRevealedCount] = useState(0)
  const [currentMultiplier, setCurrentMultiplier] = useState(1)
  const [cashOut, setCashOut] = useState(null)
  const [spins, setSpins] = useState(0)

  const startGame = useCallback((row, col) => {
    const newBoard = createBoard(row, col)
    newBoard[row][col].revealed = true
    setBoard(newBoard)
    setGameOver(false)
    setWon(false)
    setRevealedCount(1)
    setCurrentMultiplier(1)
    setCashOut(null)
    setSpins(0)
  }, [])

  const handleCellClick = (row, col) => {
    if (!board || gameOver || board[row][col].revealed) return

    // Cash out logic
    if (cashOut !== null) return

    const newBoard = board.map(r => r.map(c => ({ ...c })))
    newBoard[row][col].revealed = true

    if (newBoard[row][col].isMine) {
      // Reveal all mines
      newBoard.forEach((r, ri) => r.forEach((c, ci) => {
        if (c.isMine) newBoard[ri][ci].revealed = true
      }))
      setBoard(newBoard)
      setGameOver(true)
      setCashOut(0)
      return
    }

    const newRevealed = revealedCount + 1
    const multiplierIndex = Math.min(Math.floor(newRevealed / 3), MULTIPLIERS.length - 1)
    const newMultiplier = MULTIPLIERS[multiplierIndex]
    const newCashOut = betAmount * newMultiplier

    setBoard(newBoard)
    setRevealedCount(newRevealed)
    setCurrentMultiplier(newMultiplier)
    setCashOut(newCashOut)
    setSpins(s => s + 1)
  }

  const handleCashOut = () => {
    setGameOver(true)
    setWon(true)
  }

  const resetGame = () => {
    setBoard(null)
    setGameOver(false)
    setWon(false)
    setRevealedCount(0)
    setCurrentMultiplier(1)
    setCashOut(null)
    setSpins(0)
  }

  useEffect(() => {
    if (board && !gameOver && cashOut !== null) {
      setWon(revealedCount === GRID_SIZE * GRID_SIZE - MINE_COUNT)
    }
  }, [revealedCount, gameOver, cashOut, board])

  return (
    <>
      <Sidebar />
      <Header usdtBalance={betAmount} username="Player" />
      <div className="content-body">
        <div className="content-inner">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 24, color: '#00FF41' }}>
            💣 Minesweeper Cash
          </h2>

          {/* Status */}
          <div style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            fontFamily: 'monospace'
          }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: 4 }}>BET</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{betAmount} USDT</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: 4 }}>MULTIPLIER</div>
                <div style={{ color: '#00FF41', fontSize: '1.2rem', fontWeight: 'bold' }}>{currentMultiplier.toFixed(1)}x</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: 4 }}>CASH OUT</div>
                <div style={{ color: cashOut !== null ? '#FFD700' : '#666', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {cashOut !== null ? `${cashOut.toFixed(2)} USDT` : '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: 4 }}>CELLS LEFT</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {board ? `${GRID_SIZE * GRID_SIZE - MINE_COUNT - revealedCount}` : '25'}
                </div>
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
                {won ? `🎉 YOU WON ${(betAmount * currentMultiplier).toFixed(2)} USDT!` : '💥 GAME OVER'}
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
                const adjacent = countAdjacentMines(board, ri, ci)
                const bgColor = cell.revealed
                  ? cell.isMine ? '#ff4444' : '#1a1a1a'
                  : '#222'
                const borderColor = cell.revealed ? '#333' : '#444'

                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => handleCellClick(ri, ci)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 6,
                      cursor: cell.revealed ? 'default' : 'pointer',
                      fontSize: '1.2rem',
                      fontFamily: 'monospace',
                      transition: 'all 0.15s ease',
                      transform: cell.revealed ? 'scale(0.95)' : 'scale(1)',
                      boxShadow: cell.revealed ? 'none' : '0 2px 8px rgba(0,255,65,0.2)'
                    }}
                  >
                    {cell.revealed && !cell.isMine && adjacent > 0 && (
                      <span style={{
                        color: ['#fff', '#00FF41', '#FFD700', '#ff8800', '#ff4444', '#00ccff'][adjacent]
                      }}>
                        {adjacent}
                      </span>
                    )}
                    {cell.revealed && !cell.isMine && adjacent === 0 && ' '}
                    {cell.revealed && cell.isMine && '💣'}
                  </button>
                )
              })
            ) : (
              Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => (
                <button
                  key={i}
                  onClick={() => startGame(Math.floor(i / GRID_SIZE), i % GRID_SIZE)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: '#222',
                    border: '2px solid #444',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#666',
                    fontFamily: 'monospace',
                    transition: 'all 0.15s ease'
                  }}
                >
                  TAP
                </button>
              ))
            )}
          </div>

          {/* Cash Out Button */}
          {board && !gameOver && cashOut !== null && (
            <button
              onClick={handleCashOut}
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
                cursor: 'pointer',
                fontFamily: 'monospace',
                transition: 'transform 0.15s ease',
                boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
              }}
            >
              CASH OUT {cashOut.toFixed(2)} USDT
            </button>
          )}

          {gameOver && (
            <button
              onClick={resetGame}
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
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              NEW GAME
            </button>
          )}

          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}
