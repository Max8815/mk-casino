/**
 * Provably Fair Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow per game round:
 *   1. generateServerSeed()  → secret server seed (never shown before spin)
 *   2. hashServerSeed()      → SHA-256 commitment shown to player up-front
 *   3. Player optionally sets their own clientSeed
 *   4. Spin → outcome = derive*(serverSeed, clientSeed, nonce)
 *   5. Reveal serverSeed → player can verify with verifyOutcome()
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Returns a cryptographically random hex string of `byteCount` bytes */
export function generateRandomHex(byteCount = 32) {
    const bytes = new Uint8Array(byteCount);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 of a string → hex string (async, uses Web Crypto) */
export async function sha256(text) {
    const encoded = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a new server seed and return its SHA-256 commitment together */
export async function newServerSeed() {
    const seed = generateRandomHex(32);
    const hash = await sha256(seed);
    return { serverSeed: seed, serverSeedHash: hash };
}

/**
 * Core derivation: hash(serverSeed + ':' + clientSeed + ':' + nonce)
 * Returns the full 64-char hex hash.
 */
export async function deriveHash(serverSeed, clientSeed, nonce) {
    return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

/**
 * Map the first 8 hex chars of the hash to an integer in [0, range).
 * Different offsets are used for independent reels/dice.
 */
function hashSliceToInt(hash, offset = 0, range = 100) {
    // Each hex char = 4 bits; we take 8 chars = 32 bits
    const slice = hash.slice(offset * 8, offset * 8 + 8);
    return parseInt(slice, 16) % range;
}

// ─── Game-specific outcome derivers ───────────────────────────────────────────

/**
 * Dice roll: 1–100
 * Uses first 8 hex chars of hash.
 */
export function deriveDice(hash) {
    return (parseInt(hash.slice(0, 8), 16) % 100) + 1;
}

/**
 * Roulette: 0–36 (European, 37 pockets)
 * Uses first 8 hex chars.
 */
export function deriveRoulette(hash) {
    return hashSliceToInt(hash, 0, 37);
}

/**
 * Slots: returns an array of `reelCount` indices, each in [0, poolSize).
 * Uses a different 8-char window per reel so they are independent.
 */
export function deriveSlots(hash, reelCount = 3, poolSize = 62) {
    return Array.from({ length: reelCount }, (_, i) => hashSliceToInt(hash, i, poolSize));
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify a past game.
 * Returns { valid, hash, derived } where `derived` is the numeric outcome.
 *
 * @param {'roulette'|'slots'|'dice'} game
 * @param {string} serverSeed   - revealed after game
 * @param {string} clientSeed
 * @param {number} nonce
 * @param {number|number[]} expectedOutcome - number the game reported
 */
export async function verifyOutcome(game, serverSeed, clientSeed, nonce, expectedOutcome, poolSize = 62) {
    const hash = await deriveHash(serverSeed, clientSeed, nonce);
    let derived;
    switch (game) {
        case 'dice':
            derived = deriveDice(hash);
            break;
        case 'roulette':
            derived = deriveRoulette(hash);
            break;
        case 'slots':
            derived = deriveSlots(hash, Array.isArray(expectedOutcome) ? expectedOutcome.length : 3, poolSize);
            break;
        default:
            throw new Error(`Unknown game: ${game}`);
    }

    const valid = Array.isArray(derived)
        ? derived.every((v, i) => v === expectedOutcome[i])
        : derived === expectedOutcome;

    return { valid, hash, derived };
}
