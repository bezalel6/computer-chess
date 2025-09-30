# Computer Chess - Quick Start Guide

**Status:** Core gameplay features complete and ready for testing!

## Prerequisites

- Node.js v20+ (check: `node --version`)
- PostgreSQL database (local or hosted)
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
cd computer-chess-next
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/computer_chess_dev"

# NextAuth
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
# Create database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# (Optional) Add test users
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Features Implemented

### Core Gameplay
- ✅ Interactive chess board with move validation
- ✅ Pawn promotion with piece selection
- ✅ Game state management with Zustand
- ✅ Move history tracking

### Matchmaking
- ✅ Queue-based random matchmaking
- ✅ Challenge specific users
- ✅ Match persistence in database

### Challenges
- ✅ Dynamic challenge generation using Stockfish
- ✅ Best move, worst move, best knight move challenges
- ✅ Real-time challenge validation
- ✅ Score tracking

### Audio
- ✅ Move sounds (capture, castle, check, promote)
- ✅ Game event sounds (start, end, fail)
- ✅ Preloaded audio for instant playback

### UI/UX
- ✅ Responsive design (mobile-friendly)
- ✅ Dark theme
- ✅ Game status indicators
- ✅ Challenge cards with status
- ✅ Player scores display
- ✅ Game over dialog

---

## How to Play

### 1. Create Account or Play as Guest

Visit `/login` and either:
- Create an account with username/password
- Click "Play as Guest" for instant access

### 2. Find a Match

On the `/play` page:
- Click "Find Random Match" to enter matchmaking queue
- OR enter a friend's username to challenge them
- Wait for opponent (may take 30s-1min in testing)

### 3. Play Chess

- Make moves by dragging pieces
- For pawn promotion, select desired piece from dialog
- Challenges appear in left panel on your turn
- Complete challenges to earn points
- Move history shown in left panel

### 4. Win the Game

- Checkmate your opponent
- Higher score wins if both checkmate attempts fail
- Game over dialog shows final results

---

## Testing the App

### Test with Two Browser Windows

1. **Window 1:** Log in as `alice` (password: `password123`)
2. **Window 2:** Log in as `bob` (password: `password123`)
3. Both click "Find Random Match"
4. Should match within 3-5 seconds
5. Play chess and verify:
   - Moves appear on both sides
   - Challenges generate
   - Sounds play
   - Scores update

### Test Solo (Offline Mode)

1. Log in and start playing
2. Open browser DevTools Console
3. Make moves and watch challenges generate
4. Verify:
   - Move validation works
   - Promotion dialog appears
   - Sounds play correctly
   - Challenge detection works

---

## File Structure

```
computer-chess-next/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (game)/play/           # Main game page
│   ├── actions/
│   │   ├── auth.ts            # Authentication actions
│   │   └── match.ts           # Matchmaking actions
│   └── api/auth/              # NextAuth API routes
│
├── components/
│   ├── game/
│   │   ├── ChessBoard.tsx     # Interactive chess board
│   │   └── GameOverDialog.tsx # End game modal
│   ├── panels/
│   │   ├── LeftPanel.tsx      # Challenges & move log
│   │   └── RightPanel.tsx     # Player info & controls
│   └── ui/                    # shadcn/ui components
│
├── lib/
│   ├── chess/
│   │   └── challenge-maker.ts # Challenge generation
│   ├── sounds/
│   │   └── manager.ts         # Sound system
│   ├── stockfish/
│   │   └── worker-manager.ts  # Stockfish integration
│   └── db/                    # Database utilities
│
├── stores/
│   ├── gameStore.ts           # Game state (Zustand)
│   └── challengeStore.ts      # Challenge state
│
├── hooks/
│   ├── useSound.ts            # Sound effects hook
│   └── useStockfish.ts        # Stockfish hook
│
└── public/
    ├── sounds/                # Game sound effects
    └── stockfish.js           # Stockfish engine
```

---

## Known Limitations

### Real-Time Communication
- Moves are stored in database but not pushed in real-time
- Players need to refresh or poll for opponent moves
- **Solution:** Add Pusher, Socket.IO, or Supabase Realtime (see MIGRATION_GUIDE.md)

### Matchmaking
- Simple FIFO queue without skill-based matching
- No timeout handling for stale queue entries
- **Solution:** Add ELO ratings and queue cleanup job

### Challenge Generation
- Can be slow (1-2 seconds) on first move
- Stockfish analysis limited to 100ms per move
- **Solution:** Pre-generate challenges or increase analysis time

---

## Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps  # if using Docker
psql -h localhost -U postgres  # if native

# Regenerate Prisma client
npm run db:generate
npm run db:push
```

### "Sounds not playing"
- Check browser console for errors
- Verify files exist in `public/sounds/`
- Some browsers block autoplay - user interaction needed

### "Stockfish not working"
- Verify `public/stockfish.js` exists
- Check browser console for Web Worker errors
- Try refreshing the page

### "Match not starting"
- Check both users clicked "Find Match"
- Wait at least 30 seconds
- Check database for MatchQueue entries: `npm run db:studio`

---

## Database Management

```bash
# View database in GUI
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:push --force-reset

# Create new migration
npm run db:migrate

# Seed test users
npm run db:seed
```

---

## Development Tips

### Hot Reload Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### TypeScript Errors
```bash
# Regenerate Prisma types
npm run db:generate

# Check for errors
npm run lint
```

### Performance Optimization
- Use `React.memo` for chess board (if needed)
- Debounce challenge generation
- Lazy load Stockfish worker

---

## Next Steps

1. ✅ **Test the app** - Follow testing guide above
2. 🔄 **Add real-time** - Implement Pusher/Socket.IO (optional)
3. 🎨 **Customize UI** - Adjust colors, add animations
4. 🚀 **Deploy** - Push to Vercel/Railway/Heroku
5. 📱 **Mobile** - Test on mobile devices, add PWA support

---

## Need Help?

- Check `MIGRATION_GUIDE.md` for detailed architecture docs
- Review `README.md` for project overview
- Open GitHub issue for bugs
- Check console logs for errors

---

**Version:** 1.0 - Core Features Complete
**Last Updated:** 2025-09-30
**Status:** Ready for Testing and Enhancement