import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import {
  createUserDoc,
  createTransactionDoc,
  createGameHistoryDoc,
  createBetDoc,
  createBondDoc,
} from './schema';

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function createUser({ uid, email, username }) {
  const ref = doc(db, 'users', uid);
  const data = createUserDoc({ uid, email, username });
  await setDoc(ref, data);
  return data;
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUser(uid, fields) {
  await updateDoc(doc(db, 'users', uid), { ...fields, updatedAt: serverTimestamp() });
}

export async function getUserByUsername(username) {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
}

// ─── WALLET AUTH ──────────────────────────────────────────────────────────────

/**
 * Get or create a user document keyed by wallet address (always lowercase).
 * On first connect this provisions the account with the welcome balance.
 * Returns the user document data.
 */
export async function getOrCreateWalletUser(rawAddress) {
  const address = rawAddress.toLowerCase();
  const ref = doc(db, 'users', address);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Update last-seen timestamp
    await updateDoc(ref, { lastSeenAt: serverTimestamp() });
    return snap.data();
  }

  // First connect — provision account
  const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const data = {
    uid: address,
    walletAddress: address,
    username: shortAddr,
    balance: 100,           // welcome bonus
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalWagered: 0,
    totalWon: 0,
    gamesPlayed: 0,
    authType: 'wallet',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return data;
}

/**
 * Append an AI interaction record for a wallet user.
 * Stored under ai_interactions/{docId}, keyed by walletAddress.
 */
export async function saveAIInteraction(walletAddress, { prompt, response, context = null }) {
  const address = walletAddress.toLowerCase();
  const data = {
    walletAddress: address,
    prompt,
    response,
    context,          // e.g. { game: 'roulette', page: 'dashboard' }
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'ai_interactions'), data);
  return { id: ref.id, ...data };
}

export async function getAIInteractions(walletAddress, limitCount = 50) {
  const address = walletAddress.toLowerCase();
  const q = query(
    collection(db, 'ai_interactions'),
    where('walletAddress', '==', address),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── BALANCE (atomic) ─────────────────────────────────────────────────────────

/**
 * Atomically update a user's balance.
 * Pass positive delta to add, negative to deduct.
 * Throws if balance would go below 0.
 */
export async function adjustBalance(uid, delta) {
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('User not found');
    const current = snap.data().balance;
    if (current + delta < 0) throw new Error('Insufficient balance');
    tx.update(ref, {
      balance: increment(delta),
      updatedAt: serverTimestamp(),
    });
  });
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function createTransaction({ userId, type, amount, txHash = null, note = null }) {
  const data = createTransactionDoc({ userId, type, amount, txHash, note });
  const ref = await addDoc(collection(db, 'transactions'), data);
  return { id: ref.id, ...data };
}

export async function updateTransaction(txId, fields) {
  await updateDoc(doc(db, 'transactions', txId), { ...fields, updatedAt: serverTimestamp() });
}

export async function getUserTransactions(userId, limitCount = 50) {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── GAME HISTORY ─────────────────────────────────────────────────────────────

/**
 * Record a completed game and atomically update user stats.
 */
export async function recordGame({ userId, game, betAmount, winAmount, result }) {
  const profit = winAmount - betAmount;

  // Save game history document
  const data = createGameHistoryDoc({ userId, game, betAmount, winAmount, result });
  const ref = await addDoc(collection(db, 'game_history'), data);

  // Update user aggregate stats atomically
  await updateDoc(doc(db, 'users', userId), {
    balance: increment(profit),
    totalWagered: increment(betAmount),
    totalWon: increment(winAmount > 0 ? winAmount : 0),
    gamesPlayed: increment(1),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id, ...data };
}

export async function getUserGameHistory(userId, limitCount = 100) {
  const q = query(
    collection(db, 'game_history'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserGameHistoryByGame(userId, game, limitCount = 50) {
  const q = query(
    collection(db, 'game_history'),
    where('userId', '==', userId),
    where('game', '==', game),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── BETS ─────────────────────────────────────────────────────────────────────

export async function recordBet({ userId, game, betType, betAmount, odds, outcome, winAmount }) {
  const data = createBetDoc({ userId, game, betType, betAmount, odds, outcome, winAmount });
  const ref = await addDoc(collection(db, 'bets'), data);
  return { id: ref.id, ...data };
}

export async function getUserBets(userId, limitCount = 100) {
  const q = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── BONDS ────────────────────────────────────────────────────────────────────

export async function createBond({ userId, amount, currency = 'EUR', yieldRate = 0.10, termYears = 5 }) {
  const data = createBondDoc({ userId, amount, currency, yieldRate, termYears });
  const ref = await addDoc(collection(db, 'bonds'), data);
  return { id: ref.id, ...data };
}

export async function getUserBonds(userId) {
  const q = query(
    collection(db, 'bonds'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateBond(bondId, fields) {
  await updateDoc(doc(db, 'bonds', bondId), { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteBond(bondId) {
  await deleteDoc(doc(db, 'bonds', bondId));
}
