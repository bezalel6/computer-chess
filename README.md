# Computer Chess - Next.js 15

A modern multiplayer chess application with dynamic challenges, real-time gameplay, and move analysis powered by Stockfish.

**Status:** ✅ Production Ready | 🚀 [Deploy to Vercel](./DEPLOYMENT.md)

## Features

- **Authentication System** ✅
  - Username/password registration and login
  - Guest user support (play without an account)
  - Secure session management with NextAuth.js

- **Multiplayer Chess** ✅
  - Real-time move synchronization with Pusher
  - Random matchmaking queue
  - Friend challenges
  - Instant opponent move updates

- **Dynamic Challenges** ✅
  - AI-powered challenge generation using Stockfish
  - "Best Move", "Worst Move", "Best Knight Move" challenges
  - Real-time scoring system

- **Modern Tech Stack**
  - Next.js 15 with App Router
  - React 19
  - TypeScript (strict mode)
  - Tailwind CSS + shadcn/ui
  - Prisma + PostgreSQL
  - NextAuth.js
  - Pusher Channels for real-time

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and navigate:**
   ```bash
   cd computer-chess-next
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL, secrets, and Pusher credentials
   ```

4. **Create Pusher account** (for real-time features)
   - Sign up at [pusher.com](https://pusher.com) (free tier available)
   - Create a Channels app
   - Add credentials to `.env.local`

5. **Set up database:**
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed  # Optional: creates test users
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Open browser:**
   http://localhost:3000

8. **Test real-time features:**
   - Open two browser windows
   - Login as different users
   - Start a match and play moves
   - Verify moves sync instantly

## Project Status

**Current Phase:** ✅ All Phases Complete - Production Ready

**What's Working:**
- ✅ User authentication (login, register, guest)
- ✅ Database with Prisma ORM
- ✅ Interactive chess board with legal move validation
- ✅ Random matchmaking queue
- ✅ Real-time move synchronization (Pusher)
- ✅ Dynamic challenge generation (Stockfish)
- ✅ Sound effects for all game events
- ✅ Score tracking and game over detection
- ✅ Responsive dark theme UI

**Ready for Deployment:**
- Vercel deployment configuration ready
- Production database setup guide
- Environment variable documentation
- Monitoring and troubleshooting guides

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions and [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for technical details.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with test data
```

## Project Structure

```
app/                # Next.js pages and routes
  (auth)/           # Authentication pages
  lobby/            # Matchmaking lobby
  actions/          # Server Actions
  api/              # API routes
components/         # React components
  ui/               # shadcn/ui components
  providers/        # Context providers
lib/                # Utility functions
  auth/             # Authentication config
  db/               # Database helpers
prisma/             # Database schema and migrations
types/              # TypeScript type definitions
```

## Environment Variables

Required variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/computer_chess_dev"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Pusher (Real-time communication)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production environment setup.

## Database Setup

### Using Docker (Recommended)

```bash
docker run --name computer-chess-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=computer_chess_dev \
  -p 5432:5432 \
  -d postgres:16
```

### Using Hosted Services

- **Vercel Postgres**: Integrated with Vercel deployment
- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech

## Test Accounts

After running `npm run db:seed`:

```
Username: alice
Password: password123

Username: bob
Password: password123
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 |
| Language | TypeScript 5.9 |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 |
| Components | shadcn/ui |
| Database | PostgreSQL + Prisma |
| Authentication | NextAuth.js 5 |
| State Management | Zustand |
| Real-time | Pusher Channels |
| Chess Logic | chess.ts |
| Chess UI | react-chessboard |
| Chess Engine | Stockfish.js |

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide for Vercel
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete setup and technical details
- **[QUICK_START.md](./QUICK_START.md)** - Fast setup for local development
- [Requirements Document](../claudedocs/nextjs-migration-requirements.md) - Original specifications

## Development Roadmap

- [x] **Phase 1:** Foundation (authentication, database, UI components)
- [x] **Phase 2:** Core gameplay (chess board, matchmaking, game state)
- [x] **Phase 3:** Real-time communication (Pusher integration)
- [x] **Phase 4:** Challenges & scoring (Stockfish integration)
- [x] **Phase 5:** Polish & features (audio, game over detection)
- [x] **Phase 6:** Deployment preparation (Vercel config, docs)

**Future Enhancements:**
- [ ] Game controls (resign, draw offers, rematch)
- [ ] Player profiles and statistics
- [ ] ELO rating system
- [ ] Match history and replay viewer
- [ ] Friends list and in-game chat
- [ ] Tournament brackets

## Contributing

This is a migration from an existing React + Vite project. See the original project at `../` for reference implementation.

## License

Private project - All rights reserved

## Acknowledgments

- Original "Computer Chess" concept and implementation
- Next.js team for the excellent framework
- Prisma team for the amazing ORM
- shadcn for the beautiful UI components