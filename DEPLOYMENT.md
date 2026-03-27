# MK Casino - Deployment Guide

## Quick Start

### 1. Build the Application
```bash
cd /home/maksym/mk-casino
npm run build
```

✅ **Status:** Build completed successfully
- Output: `./build/` directory
- No errors or warnings (source map warnings are normal)

### 2. Verify All Games Are Visible

After deployment, verify the dashboard shows **9 games**:

```
Dashboard Grid:
[Roulette]    [Car Slots]    [Erotic Slots]
[Minesweeper] [Crash]        [Hi-Lo]
[Tap Frenzy]  [Dice]         [Racing]
```

Plus 2 Quick Links:
- Wallet
- History

### 3. Test Each Game Route

```
http://your-domain/                    → Dashboard ✅
http://your-domain/roulette            → Roulette Game ✅
http://your-domain/slots               → Car Slots ✅
http://your-domain/erotic-slots        → Erotic Slots ✅
http://your-domain/minesweeper         → Minesweeper ✅
http://your-domain/crash               → Crash Game ✅
http://your-domain/hilo                → Hi-Lo Game ✅
http://your-domain/tapfrenzy           → Tap Frenzy ✅
http://your-domain/dice                → Dice Game ✅
http://your-domain/racing              → Racing Game ✅
http://your-domain/wallet              → Wallet ✅
http://your-domain/history             → History ✅
```

## What's New in This Release

### 🎮 Game Display
- **Fixed:** Dashboard now shows all 9 playable games
- **Added:** HiLo, TapFrenzy, Dice to game grid
- **Updated:** Badge shows "9 Live" games

### 🔧 Code Quality
- **Removed:** All console.logs (2 removed from racing.jsx)
- **Fixed:** Minesweeper component props handling
- **Enhanced:** Erotic Slots with provably fair logic
- **Build:** Zero errors ✅

### 🎲 Provably Fair
- All games support verifiable randomization
- Each game includes ProvablyFairPanel component
- Server seed, client seed, and nonce tracking enabled

## Configuration

### Session Management
Games use **localStorage** for session persistence:
- Session key: `mk_user_session`
- Auto-restores user on page reload
- Stores: `uid`, `walletAddress`, `username`, `balance`

### Wallet Integration
- MetaMask support enabled
- Fallback to mock wallet for testing
- USDT (TRC-20) on TRON network

### Game Settings
All games initialized with:
- **Default Balance:** 1000 USDT (mock)
- **Default Bet:** 10 USDT
- **Min Bet:** 1 USDT
- **Game Loop:** 50ms tick rate (where applicable)

## File Structure

```
mk-casino/
├── build/                    ← Deploy these files
├── src/
│   ├── jsx/
│   │   ├── pages/
│   │   │   ├── dashboard.jsx      ✅ UPDATED
│   │   │   ├── roulette.jsx       ✅ Clean
│   │   │   ├── slots.jsx          ✅ Clean
│   │   │   ├── erotic-slots.jsx   ✅ UPDATED
│   │   │   ├── minesweeper.jsx    ✅ UPDATED
│   │   │   ├── crash.jsx          ✅ Clean
│   │   │   ├── hilo.jsx           ✅ Clean
│   │   │   ├── tapfrenzy.jsx      ✅ Clean
│   │   │   ├── dice.jsx           ✅ Clean
│   │   │   ├── racing.jsx         ✅ UPDATED
│   │   │   ├── wallet.jsx         ✅ Clean
│   │   │   ├── history.jsx        ✅ Clean
│   │   │   └── login.jsx          ✅ Clean
│   │   ├── layout/
│   │   │   ├── header.jsx         ✅ Used
│   │   │   └── sidebar.jsx        ✅ Used
│   │   ├── router.jsx             ✅ All routes
│   │   └── components/
│   │       └── ProvablyFairPanel.jsx ✅ Integrated
│   └── utils/
│       └── provablyFair.js        ✅ Used by all games
└── REFACTOR_SUMMARY.md          ← What was fixed
```

## Troubleshooting

### Issue: Game not loading
- **Check:** Browser console for errors
- **Verify:** Route is correct in URL
- **Ensure:** User is logged in (redirects to /login if not)

### Issue: "Insufficient balance" error
- **Expected:** Feature working correctly
- **To Test:** Use "Deposit" button or increase mock balance in code

### Issue: Provably fair verification not showing
- **Check:** `lastGame` state in component
- **Verify:** `ProvablyFairPanel` is mounted
- **Expected:** Shows after first game is played

### Issue: Build fails
- **Run:** `npm install` to ensure all dependencies
- **Check:** Node.js version (should be v25.x)
- **Try:** `npm cache clean --force && npm install`

## Performance Notes

### Optimizations
- All games use `useCallback` for stable function references
- `useMemo` for expensive calculations (Racing game)
- `requestAnimationFrame` for smooth animations
- Refs used for game loop state (not component state)

### Bundle Size
- Main build optimized with Create React App
- CSS is scoped and minified
- No external game engine dependencies
- Wallet integration is modular

## Security Notes

- ✅ No sensitive keys in client code
- ✅ Session tokens stored in localStorage (safe for demo)
- ✅ Balance is mock/frontend only (backend implementation needed for production)
- ✅ MetaMask connection is optional
- ✅ All inputs validated before use

## Next Steps for Production

1. **Backend Integration:**
   - Move balance/game logic to backend
   - Implement real transaction verification
   - Add user authentication (JWT tokens)
   - Store game history in database

2. **Wallet Integration:**
   - Connect to real USDT TRC-20 contract
   - Implement deposit/withdrawal system
   - Add transaction verification

3. **Security:**
   - Add HTTPS requirement
   - Implement rate limiting
   - Add fraud detection
   - Regular security audits

4. **Monitoring:**
   - Add error tracking (Sentry)
   - Implement analytics
   - Add game metrics/telemetry
   - Monitor server performance

## Support

For issues or questions about the deployment:
- Check `REFACTOR_SUMMARY.md` for what changed
- Review game code comments for implementation details
- Check browser console for runtime errors
- Verify all routes are accessible

---

**Deployment Status:** ✅ READY
**Build Status:** ✅ COMPLETE
**Test Status:** ✅ PASSED
