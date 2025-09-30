# Database Schema Fix

## Issue: Missing expiresAt Field

**Error:**
```
Invalid `prisma.matchQueue.create()` invocation:
Argument `expiresAt` is missing.
```

**Root Cause:**
The Prisma schema defines `expiresAt` as required, but the Server Action wasn't providing it.

## Fix Applied

**File:** `app/actions/match.ts`

**Before:**
```typescript
await prisma.matchQueue.create({
  data: {
    userId,
  },
});
```

**After:**
```typescript
// Expire queue entries after 5 minutes
const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

await prisma.matchQueue.create({
  data: {
    userId,
    expiresAt,
  },
});
```

## MatchQueue Schema

The `MatchQueue` model tracks users waiting for a match:

```prisma
model MatchQueue {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime  // Required - when to remove from queue
}
```

**Purpose:** Prevents stale queue entries from users who navigated away or lost connection.

**Cleanup Logic:** Should periodically delete expired entries (not yet implemented).

## Testing

Matchmaking should now work:
1. User clicks "Find Random Match"
2. If no opponent: User added to queue (expires in 5 minutes)
3. If opponent found: Match created immediately
4. Users see board and can play

## Future Improvements

Add a cleanup job to remove expired queue entries:

```typescript
// Example cleanup function
async function cleanupExpiredQueue() {
  await prisma.matchQueue.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(), // Less than now
      },
    },
  });
}
```

Run this periodically (e.g., with a cron job or background task).

## Status

✅ Fixed - Matchmaking should now work correctly