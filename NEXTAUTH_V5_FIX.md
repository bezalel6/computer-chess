# NextAuth v5 Migration Fix

## Issue
The initial implementation used NextAuth v4 API patterns with NextAuth v5 (beta), causing errors:
- `export 'default' was not found in 'next-auth/middleware'`
- `getServerSession is not a function`

## What Was Fixed

### 1. Updated `lib/auth/config.ts`
**Before (v4 API):**
```typescript
import { NextAuthOptions } from 'next-auth';
export const authOptions: NextAuthOptions = { ... };
```

**After (v5 API):**
```typescript
import NextAuth from 'next-auth';
export const { handlers, auth, signIn, signOut } = NextAuth({ ... });
```

### 2. Updated `middleware.ts`
**Before (v4 API):**
```typescript
export { default } from 'next-auth/middleware';
```

**After (v5 API):**
```typescript
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  // ... protection logic
});
```

### 3. Created `app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from '@/lib/auth/config';
export const { GET, POST } = handlers;
```

### 4. Updated All Session Calls
**Before (v4 API):**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const session = await getServerSession(authOptions);
```

**After (v5 API):**
```typescript
import { auth } from '@/lib/auth/config';

const session = await auth();
```

## Files Changed
- ✅ `lib/auth/config.ts` - Core auth configuration
- ✅ `middleware.ts` - Route protection
- ✅ `app/api/auth/[...nextauth]/route.ts` - API handlers (created)
- ✅ `app/page.tsx` - Landing page
- ✅ `app/lobby/page.tsx` - Lobby page
- ✅ `app/actions/match.ts` - All 4 occurrences

## NextAuth v5 Key Changes

### 1. Configuration Export
```typescript
// v4
export const authOptions: NextAuthOptions = { ... };

// v5
export const { handlers, auth, signIn, signOut } = NextAuth({ ... });
```

### 2. Session Access
```typescript
// v4
const session = await getServerSession(authOptions);

// v5
const session = await auth();
```

### 3. Middleware
```typescript
// v4
export { default } from 'next-auth/middleware';

// v5
export default auth((req) => {
  // Custom logic with req.auth
});
```

### 4. API Routes
```typescript
// v4
export default NextAuth(authOptions);

// v5
import { handlers } from '@/lib/auth/config';
export const { GET, POST } = handlers;
```

## Testing

The server should now start without NextAuth errors. To test:

```bash
cd computer-chess-next
npm run dev
```

Expected output:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

No more:
- ❌ `"next-auth/middleware" is deprecated`
- ❌ `getServerSession is not a function`

## Node.js Version Note

⚠️ **Important**: Next.js 15 requires Node.js >= 18.18.0

Current version detected: 18.7.0

To upgrade Node.js:
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from nodejs.org
# https://nodejs.org/
```

## References
- [NextAuth v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js 15 Requirements](https://nextjs.org/docs/getting-started/installation)