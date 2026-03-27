# MK Casino - Developer Notes

## Project Overview

MK Casino is a React-based online gaming platform with 9 playable games, each implementing provably fair randomization to ensure game fairness and transparency.

### Tech Stack
- **Framework:** React 18+ (Create React App)
- **Routing:** React Router v5 (BrowserRouter, Route, Switch)
- **Wallet:** MetaMask Web3 integration (useWallet hook)
- **Storage:** localStorage for session persistence
- **Randomization:** Custom provably fair implementation
- **Styling:** Inline styles + CSS classes
- **Build:** Create React App with Craco

---

## Game Architecture

### Game Structure Pattern

All games follow a consistent pattern:

```jsx
const GameName = ({ user, onLogout }) => {
  // 1. Core game state
  const [balance, setBalance] = useState(user?.balance || 1000);
  const [betAmount, setBetAmount] = useState('10');
  const [gameState, setGameState] = useState('idle');
  
  // 2. Provably fair state
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState(() => generateRandomHex());
  const [nonce, setNonce] = useState(0);
  const [lastGame, setLastGame] = useState(null);
  
  // 3. Game logic (useCallback for memoization)
  const playGame = useCallback(() => { ... }, [dependencies]);
  
  // 4. Render: Sidebar, Header, Content, ProvablyFairPanel
  return (
    <>
      <Sidebar />
      <Header user={user} onLogout={onLogout} />
      <div className="content-body">
        {/* Game UI */}
      </div>
      {lastGame && <ProvablyFairPanel game="gamename" data={lastGame} />}
    </>
  );
};

export default GameName;
```

---

## Provably Fair Implementation

### How It Works

1. **Server Seed:** Generated server-side, player gets hash of seed
2. **Client Seed:** Generated client-side, player can change it
3. **Nonce:** Increments with each game, prevents replay
4. **Hash Function:** `deriveHash(serverSeed, clientSeed, nonce)` produces deterministic result
5. **Game-Specific Derivation:** 
   - `deriveRoulette()` - Wheel position (0-36)
   - `deriveSlots()` - Multiple reel positions
   - `deriveHash()` - General purpose for other games

### Verification Flow

```
User plays game
  ↓
Game stores: { serverSeed, clientSeed, nonce, hash }
  ↓
ProvablyFairPanel displays this data
  ↓
User can verify hash offline using seed + nonce
```

### For Developers Adding Games

```jsx
// 1. Import functions
import { newServerSeed, deriveHash, generateRandomHex } from '../../utils/provablyFair';

// 2. Initialize in component
const [serverSeed, setServerSeed] = useState('');
const [clientSeed] = useState(() => generateRandomHex());
const [nonce, setNonce] = useState(0);

// 3. On component mount
useEffect(() => {
  newServerSeed().then(({ serverSeed: s, serverSeedHash: h }) => {
    setServerSeed(s);
    // Store hash for verification
  });
}, []);

// 4. In game logic
const hash = deriveHash(serverSeed, clientSeed, nonce);
const result = parseInt(hash.substring(0, 8), 16) % gameRange;

// 5. Increment nonce
setNonce(n => n + 1);

// 6. Store for verification
setLastGame({ serverSeed, clientSeed, nonce, hash });
```

---

## State Management Patterns

### Balance Management
```jsx
// When placing bet
setBalance(prev => prev - betAmount);

// When winning
setBalance(prev => prev + winnings);

// Always use functional updates to avoid stale state
```

### Game State Machine
```jsx
// Typical game states:
'idle'    → Game ready for input
'playing' → Game in progress
'result'  → Game finished, showing result
'crashed' → Game ended early (lose condition)
'won'     → Game ended successfully
```

### History Tracking
```jsx
const [history, setHistory] = useState([]);

// Add to history
setHistory(prev => [{
  id: Date.now(),
  symbols: results,
  bet: betAmount,
  winnings: winAmount,
  net: winAmount - betAmount,
  time: new Date().toLocaleTimeString(),
}, ...prev].slice(0, 20)); // Keep last 20 rounds
```

---

## Common Patterns & Best Practices

### 1. useCallback Dependencies
```jsx
// ❌ WRONG - No dependencies, captures stale state
const handleSpin = useCallback(() => {
  setSpinning(false);
}, []);

// ✅ CORRECT - Include all dependencies
const handleSpin = useCallback(() => {
  setSpinning(false);
}, [balance, betAmount]); // Include what's used in closure
```

### 2. Loop State (Racing, Crash)
```jsx
// Use ref for game loop state, NOT component state
const gameStateRef = useRef({
  distance: 0,
  playerLane: 0,
  frame: 0,
});

useEffect(() => {
  gameStateRef.current.distance = distance;
}, [distance]); // Keep ref in sync with state
```

### 3. Animation Frames
```jsx
const animate = (callback) => {
  const frameId = requestAnimationFrame((timestamp) => {
    callback(timestamp);
    animate(callback); // Recursive for continuous loop
  });
  return frameId;
};

// Cleanup
return () => cancelAnimationFrame(frameId);
```

### 4. Form Inputs
```jsx
// For numeric inputs
const [betAmount, setBetAmount] = useState('10'); // Store as string
const bet = parseFloat(betAmount) || 0; // Parse when using

// When setting quick amounts
setBetAmount(String(value)); // Keep as string
```

---

## Header & Layout Components

### Header Component Props
```jsx
<Header 
  user={user}              // Required: user object
  onLogout={onLogout}      // Required: logout callback
  usdtBalance={balance}    // Optional: display balance
  username={user?.username} // Optional: display username
  onDeposit={handler}      // Optional: deposit button
/>
```

### Sidebar Navigation
- Automatically highlights active route using `useLocation()`
- No props needed, handles its own state
- All game routes must be in NAV array (already are)

---

## Common Issues & Solutions

### Issue: State Updates in Timeout
```jsx
// ❌ WRONG - May update after unmount
setTimeout(() => setBalance(prev => prev + 100), 1000);

// ✅ CORRECT - Use ref to track unmount
const isMountedRef = useRef(true);
useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

setTimeout(() => {
  if (isMountedRef.current) setBalance(prev => prev + 100);
}, 1000);
```

### Issue: Game Loop Lag
```jsx
// ✅ Use requestAnimationFrame instead of setInterval
const gameLoop = () => {
  // Update game state
  frameRef.current = requestAnimationFrame(gameLoop);
};
frameRef.current = requestAnimationFrame(gameLoop);

// Cleanup
return () => cancelAnimationFrame(frameRef.current);
```

### Issue: Balance Not Updating
```jsx
// ❌ WRONG - Updating same variable multiple times
setBalance(balance - bet); // Uses old balance
setBalance(balance + win); // Uses old balance again

// ✅ CORRECT - Use functional updates
setBalance(prev => prev - bet);
setBalance(prev => prev + win); // Queued after first update
```

---

## Testing Checklist for New Games

When adding a new game:

1. **Routing**
   - [ ] Game imported in `router.jsx`
   - [ ] Route defined with correct path
   - [ ] Route wrapped in guard function
   - [ ] Route visible in `sidebar.jsx`

2. **Props**
   - [ ] Accepts `user` prop
   - [ ] Accepts `onLogout` prop
   - [ ] Passes both to Header component
   - [ ] Uses `user?.balance` for initial balance

3. **State**
   - [ ] Balance state initialized
   - [ ] Bet amount state initialized
   - [ ] Game state initialized
   - [ ] Server/client seed initialized (if using provably fair)

4. **Functionality**
   - [ ] Can place bet
   - [ ] Can play game
   - [ ] Balance updates correctly
   - [ ] Game ends properly
   - [ ] Can play multiple times

5. **Provably Fair**
   - [ ] Uses `deriveHash()` or similar
   - [ ] Nonce increments after each game
   - [ ] `lastGame` state populated
   - [ ] `ProvablyFairPanel` rendered (if supported)

6. **UI/UX**
   - [ ] Renders Header and Sidebar
   - [ ] Responsive on mobile
   - [ ] Disabled inputs during gameplay
   - [ ] Disabled buttons when insufficient balance

7. **Code Quality**
   - [ ] No console logs
   - [ ] No unused imports
   - [ ] All dependencies in hooks
   - [ ] Properly uses useCallback/useMemo

---

## File Organization

### Game Files Location
- All games: `src/jsx/pages/[gamename].jsx`
- Layout: `src/jsx/layout/{header,sidebar}.jsx`
- Components: `src/jsx/components/`
- Utils: `src/utils/`

### Imports Path
- From pages to layout: `import Header from '../layout/header'`
- From pages to components: `import ProvablyFairPanel from '../components/ProvablyFairPanel'`
- From pages to utils: `import { func } from '../../utils/provablyFair'`

---

## Performance Optimization Tips

1. **useMemo for Expensive Calculations**
   ```jsx
   const multiplier = useMemo(() => 
     calculateMultiplier(distance), 
     [distance]
   );
   ```

2. **useCallback for Callbacks Passed to Children**
   ```jsx
   const handleClick = useCallback(() => {
     // ... logic
   }, [dependencies]);
   ```

3. **Refs for Values That Don't Need Render**
   ```jsx
   const gameStateRef = useRef({ ... });
   // Changes to ref don't trigger re-render
   ```

4. **requestAnimationFrame for Animations**
   ```jsx
   // Better than setInterval for game loops
   const id = requestAnimationFrame(frame => { ... });
   ```

---

## Debugging Tips

### Check State Updates
```jsx
useEffect(() => {
  console.log('balance changed:', balance);
}, [balance]);
// Remove before production!
```

### Verify Game Logic
```jsx
// Test hash generation
const testHash = deriveHash('seed1', 'seed2', 0);
console.log('Hash:', testHash.substring(0, 8)); // Remove before production
```

### Monitor Performance
```jsx
// Use React DevTools Profiler
// Check component renders are not excessive
// Look for stale closures in callbacks
```

---

## Deployment Checklist

Before deploying:
- [ ] All console.logs removed
- [ ] All imports used
- [ ] No TypeScript errors
- [ ] Build succeeds (`npm run build`)
- [ ] All games playable
- [ ] Routes work correctly
- [ ] Responsive on mobile
- [ ] Balance persists on reload

---

## Future Improvements

1. **Backend Integration**
   - Move balance to database
   - Implement real wallet integration
   - Add user authentication

2. **Analytics**
   - Track game metrics
   - Monitor player behavior
   - Detect fraud/abuse

3. **Features**
   - Leaderboards
   - Tournaments
   - Bonuses/promotions
   - Live multiplayer

4. **Performance**
   - Bundle splitting
   - Lazy loading games
   - Service worker caching
   - CDN integration

---

## Reference Links

- React Documentation: https://react.dev
- React Router: https://reactrouter.com
- Create React App: https://create-react-app.dev
- Web3 Integration: Check `useWallet` hook implementation

---

**Document Version:** 1.0
**Last Updated:** 2026-03-27 12:26 GMT+1
**Maintainer:** Development Team
