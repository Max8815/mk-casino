/**
 * Firestore Database Schema
 * ─────────────────────────
 * Collection: users/{userId}
 * Collection: transactions/{txId}
 * Collection: game_history/{gameId}
 * Collection: bets/{betId}
 * Collection: bonds/{bondId}
 */

/** @returns {Object} default user document */
export function createUserDoc({ uid, email, username }) {
  return {
    uid,
    email,
    username,
    balance: 100,           // USDT starting balance
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalWagered: 0,
    totalWon: 0,
    gamesPlayed: 0,
    isGuest: false,
    promoCodeUsed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Transaction types: 'deposit' | 'withdrawal' | 'bonus'
 * @returns {Object} transaction document
 */
export function createTransactionDoc({ userId, type, amount, status = 'pending', txHash = null, note = null }) {
  return {
    userId,
    type,           // 'deposit' | 'withdrawal' | 'bonus'
    amount,         // USDT amount
    status,         // 'pending' | 'completed' | 'failed'
    txHash,         // blockchain tx hash
    network: 'TRC-20',
    note,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Game types: 'roulette' | 'slots' | 'erotic-slots' | 'blackjack' | 'crash' | 'dice'
 * @returns {Object} game history document
 */
export function createGameHistoryDoc({ userId, game, betAmount, winAmount, result }) {
  return {
    userId,
    game,           // 'roulette' | 'slots' | 'erotic-slots'
    betAmount,
    winAmount,
    profit: winAmount - betAmount,
    result,         // game-specific result object (e.g. { number: 17, color: 'red' })
    createdAt: new Date(),
  };
}

/**
 * @returns {Object} bet document (single bet within a game session)
 */
export function createBetDoc({ userId, game, betType, betAmount, odds, outcome, winAmount }) {
  return {
    userId,
    game,
    betType,        // e.g. 'red', 'black', 'even', 'column1', 'number-17'
    betAmount,
    odds,           // payout multiplier, e.g. 2 for even money
    outcome,        // 'win' | 'loss' | 'push'
    winAmount,
    createdAt: new Date(),
  };
}

/**
 * @returns {Object} investment bond document
 */
export function createBondDoc({ userId, amount, currency = 'EUR', yieldRate = 0.10, termYears = 5 }) {
  const maturityDate = new Date();
  maturityDate.setFullYear(maturityDate.getFullYear() + termYears);

  return {
    userId,
    amount,
    currency,
    yieldRate,
    termYears,
    status: 'active',   // 'active' | 'matured' | 'cancelled'
    maturityDate,
    expectedReturn: amount * (1 + yieldRate * termYears),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
