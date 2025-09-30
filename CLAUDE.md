# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Computer Chess** is a Next.js 15 chess application with real-time multiplayer, Stockfish-powered challenges, and dynamic scoring. Built with TypeScript, React 19, Prisma, and Pusher for WebSocket communication.

## Key Commands

### Development
```bash
npm run dev          # Start dev server with Turbo (port 3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database (no migrations)
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with test data
```

**Important:** Always run `db:generate` after changing `prisma/schema.prisma`

### Testing Workflow
```bash
# 1. Setup database
npm run db:push && npm run db:generate

# 2. Start dev server
npm run dev

# 3. Test in browser
# - Open http://localhost:3000
# - Login or play as guest
# - Click "Find Random Match"
# - Open incognito window for second player
```

## Architecture

### Tech Stack
- **Framework:** Next.js 15.5 with App Router
- **React:** 19.1.1 (Server Components + Client Components)
- **TypeScript:** 5.9 strict mode
- **Database:** PostgreSQL + Prisma ORM 6.16
- **Auth:** NextAuth.js v5 (beta)
- **Real-time:** Pusher Channels (WebSocket)
- **State:** Zustand 5.0
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **Chess:** chess.ts 0.16.2
- **Board:** react-chessboard 5.6.1
- **Engine:** Stockfish.js (Web Workers)

### Directory Structure
```
app/
├── (auth)/login/          # Authentication pages
├── (game)/play/           # Main game interface
├── actions/               # Server Actions (mutations)
├── api/                   # API Route Handlers
│   └── auth/[...nextauth] # NextAuth endpoints
└── lobby/                 # Matchmaking lobby

components/
├── game/                  # Chess board, game controls
├── panels/                # Left/Right panels
├── providers/             # Context providers (Realtime)
└── ui/                    # shadcn/ui components

lib/
├── auth/                  # NextAuth configuration
├── chess/                 # Game logic, challenge generation
├── db/                    # Prisma client + query helpers
├── realtime/              # Pusher client/server
├── sounds/                # Sound manager
└── stockfish/             # Web Worker pool

stores/
├── gameStore.ts           # Chess game state (Zustand)
└── challengeStore.ts      # Challenge tracking (Zustand)

prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed data

public/
├── sounds/                # Game audio files (.wav)
└── stockfish/             # Stockfish engine files
```

### Component Patterns

**Server Components (default):**
- `app/page.tsx`, `app/lobby/page.tsx`
- Use `await auth()` for session
- Can directly query database

**Client Components (`'use client'`):**
- All game UI: `ChessBoard`, `LeftPanel`, `RightPanel`
- Any hooks: `useState`, `useEffect`, `useGameStore`
- Real-time subscriptions

**Server Actions (`'use server'`):**
- `app/actions/match.ts` - Matchmaking, moves, scores
- Always validate with `auth()` first
- Return typed results: `{ success: boolean, error?: string }`

### State Management

**Zustand Stores:**
```typescript
// gameStore.ts - Chess game state
const game = useGameStore((state) => state.game);
const makeMove = useGameStore((state) => state.makeMove);

// challengeStore.ts - Challenge tracking
const challenges = useChallengeStore((state) => state.challenges);
```

**Server State:**
- Prisma for database
- Server Actions for mutations
- No client-side caching (use Server Components)

### Database Schema

**Key Models:**
- `User` - Auth, guest mode, stats
- `Game` - Match records with FEN history
- `Move` - Individual moves with timestamps
- `Score` - Player scores per game
- `Challenge` - Challenge definitions
- `MatchQueue` - Matchmaking queue (expires in 5 min)

**Important:**
- All timestamps use `DateTime`
- `expiresAt` required for MatchQueue
- FEN stored after each move for replay

## Common Tasks

### Adding a New Feature

1. **Plan the architecture:**
   - Server Component or Client Component?
   - Need Server Action for mutations?
   - Database changes required?

2. **Database changes:**
   ```bash
   # Edit prisma/schema.prisma
   npm run db:push
   npm run db:generate
   ```

3. **Create Server Action if needed:**
   ```typescript
   // app/actions/feature.ts
   'use server';

   import { auth } from '@/lib/auth/config';
   import { prisma } from '@/lib/db/prisma';

   export async function myAction() {
     const session = await auth();
     if (!session) return { success: false, error: 'Unauthorized' };

     // Your logic here
     return { success: true };
   }
   ```

4. **Build UI component:**
   - Add to appropriate directory
   - Use TypeScript types
   - Follow existing patterns

### Working with Chess Logic

**Use chess.ts API correctly:**
```typescript
import { Chess } from 'chess.ts';

const game = new Chess();

// Check game state
game.gameOver()  // NOT isGameOver()
game.inDraw()
game.inCheck()
game.turn()  // 'w' or 'b'

// Make moves
const result = game.move({ from: 'e2', to: 'e4' });

// Get position
const fen = game.fen();
const moves = game.moves({ verbose: true });
```

### Working with react-chessboard v5

**Use options object pattern:**
```typescript
const chessboardOptions = {
  position: game.fen(),
  boardOrientation: 'white',
  onPieceDrop: handleDrop,
  allowDragging: true,  // NOT arePiecesDraggable
  boardStyle: {},       // NOT customBoardStyle
  darkSquareStyle: {},  // NOT customDarkSquareStyle
};

<Chessboard options={chessboardOptions} />
```

### Real-Time Communication

**Pusher events (optional - requires setup):**
```typescript
// Server-side trigger
import { triggerMove } from '@/lib/realtime/pusher-server';
await triggerMove(matchId, move);

// Client-side listen
const channel = pusher.subscribe(`match-${matchId}`);
channel.bind('opponent:move', (move) => {
  // Handle move
});
```

**Note:** Pusher requires credentials in `.env.local`

### Stockfish Integration

**Challenge generation:**
```typescript
import { createChallenges } from '@/lib/chess/challenge-maker';

const challenges = await createChallenges(game);
// Returns: Best Move, Worst Move, Best Knight Move
```

**Web Worker pattern:**
- Workers created in `lib/stockfish/worker-manager.ts`
- Pool of 4 workers for parallel analysis
- Each position analyzed for 100ms

## Important Rules

### NextAuth v5 API

**Always use v5 patterns:**
```typescript
// ✅ CORRECT
import { auth } from '@/lib/auth/config';
const session = await auth();

// ❌ WRONG (v4 API)
import { getServerSession } from 'next-auth';
const session = await getServerSession(authOptions);
```

### React Hooks Rules

**All hooks before conditional returns:**
```typescript
// ✅ CORRECT
const game = useGameStore((s) => s.game);
useEffect(() => { ... }, []);

if (loading) return <Loading />;

// ❌ WRONG - Hook after return
if (loading) return <Loading />;
useEffect(() => { ... }, []);
```

### Prisma Best Practices

1. **Always provide required fields:**
   ```typescript
   await prisma.matchQueue.create({
     data: {
       userId,
       expiresAt: new Date(Date.now() + 5 * 60 * 1000),
     },
   });
   ```

2. **Use transactions for related operations:**
   ```typescript
   await prisma.$transaction([
     prisma.move.create({ ... }),
     prisma.game.update({ ... }),
   ]);
   ```

3. **Validate auth before database writes:**
   ```typescript
   const session = await auth();
   if (!session) return { success: false, error: 'Unauthorized' };
   ```

### Error Handling

**Server Actions always return typed results:**
```typescript
export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function myAction(): Promise<ActionResult> {
  try {
    // ... logic
    return { success: true, data: result };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, error: 'Failed to ...' };
  }
}
```

## Environment Variables

**Required:**
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Optional (for real-time):**
```bash
# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

## Known Issues & Fixes

### Issue: NextAuth v5 errors
**Solution:** Use `auth()` not `getServerSession()`. See `NEXTAUTH_V5_FIX.md`

### Issue: React Hook order error
**Solution:** Move all hooks before conditional returns. See `FIXES_APPLIED.md`

### Issue: react-chessboard errors
**Solution:** Use v5 API with options object. See `REACT_CHESSBOARD_V5_FIX.md`

### Issue: Prisma validation errors
**Solution:** Provide all required fields (e.g., `expiresAt`). See `DATABASE_FIX.md`

## Testing Checklist

**Before committing:**
- [ ] `npm run lint` passes
- [ ] TypeScript compiles (`npm run build`)
- [ ] Database migrations tested (`npm run db:push`)
- [ ] Auth flow works (login, guest, logout)
- [ ] Matchmaking works (two browser windows)
- [ ] Chess moves work
- [ ] Sounds play correctly
- [ ] No console errors

**Manual testing:**
1. Open `http://localhost:3000`
2. Click "Play as Guest" or register
3. Click "Find Random Match"
4. Open incognito window, repeat steps 1-3
5. Both players should see board
6. Make moves on both sides
7. Verify real-time sync (if Pusher configured)

## Deployment

**Vercel (recommended):**
```bash
vercel --prod
```

**Environment variables on Vercel:**
- Add `DATABASE_URL` (production database)
- Add `NEXTAUTH_SECRET` (new secret for prod)
- Add `NEXTAUTH_URL` (your vercel.app URL)
- Add Pusher credentials (optional)

**Database setup:**
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Push schema
npm run db:push

# Generate client
npm run db:generate
```

See `DEPLOYMENT.md` for complete guide.

## Documentation

- **Setup Guide:** `MIGRATION_GUIDE.md`
- **Deployment:** `DEPLOYMENT.md`
- **Quick Start:** `QUICK_START.md`
- **All Fixes Applied:** `FIXES_APPLIED.md`
- **NextAuth v5:** `NEXTAUTH_V5_FIX.md`
- **react-chessboard v5:** `REACT_CHESSBOARD_V5_FIX.md`

## Getting Help

**Common errors:**
1. "Prisma Client not generated" → `npm run db:generate`
2. "Module not found" → `npm install`
3. "Port 3000 in use" → `portio --mine 3000` (or kill process)
4. "Database connection error" → Check `DATABASE_URL` in `.env.local`

**Debug mode:**
```bash
# Enable Prisma query logging
# Add to .env.local:
DEBUG="prisma:query"
```

## Code Style

- **TypeScript strict mode** - No `any` types
- **Functional components** - No class components
- **Named exports** - Prefer over default exports
- **Descriptive names** - `handlePieceDrop` not `onDrop`
- **Comments** - Document complex logic only
- **File organization** - Group by feature, not file type