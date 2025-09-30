# Deployment Guide

This guide covers deploying the Computer Chess application to Vercel with Pusher and a production database.

## Prerequisites

- Vercel account (free tier available)
- Pusher account (free tier: 200k messages/day, 100 connections)
- Production PostgreSQL database (Neon, Supabase, or Railway)
- Git repository

## Step 1: Setup Production Database

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (should look like `postgresql://user:password@ep-xxx.region.neon.tech/dbname`)
4. Enable connection pooling for better performance

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (URI format)

### Option C: Railway
1. Go to [railway.app](https://railway.app) and sign up
2. Create a new PostgreSQL database
3. Copy the connection string from the Variables tab

## Step 2: Setup Pusher

1. Go to [pusher.com](https://pusher.com) and sign up
2. Create a new Channels app
3. Note down the following credentials:
   - App ID
   - Key
   - Secret
   - Cluster (e.g., `us2`, `eu`, `ap1`)

**Free Tier Limits:**
- 200,000 messages per day
- 100 max concurrent connections
- Unlimited channels

This is sufficient for MVP and small-scale production use.

## Step 3: Deploy to Vercel

### Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project directory**
   ```bash
   cd computer-chess-next
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy to preview**
   ```bash
   vercel
   ```

5. **Add environment variables** (when prompted or via dashboard)
   ```
   DATABASE_URL="postgresql://user:password@host/database"
   NEXTAUTH_SECRET="your-nextauth-secret-use-openssl-rand-base64-32"
   NEXTAUTH_URL="https://your-app.vercel.app"
   PUSHER_APP_ID="your-pusher-app-id"
   PUSHER_KEY="your-pusher-key"
   PUSHER_SECRET="your-pusher-secret"
   PUSHER_CLUSTER="us2"
   NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
   NEXT_PUBLIC_PUSHER_CLUSTER="us2"
   ```

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Via Vercel Dashboard

1. **Import Git Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository (GitHub, GitLab, Bitbucket)
   - Vercel auto-detects Next.js configuration

2. **Configure Build Settings**
   - Framework: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`
   - Make sure `NEXT_PUBLIC_*` variables are checked for all environments

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations on the production database:

1. **Install Prisma CLI locally** (if not already)
   ```bash
   npm install -g prisma
   ```

2. **Set production DATABASE_URL**
   ```bash
   export DATABASE_URL="postgresql://user:password@host/database"
   ```

3. **Run migrations**
   ```bash
   cd computer-chess-next
   npx prisma migrate deploy
   ```

4. **Verify database**
   ```bash
   npx prisma studio
   ```

## Step 5: Verify Deployment

### Test Checklist

- [ ] **Authentication**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Session persists across page refreshes

- [ ] **Matchmaking**
  - [ ] Can enter matchmaking queue
  - [ ] Can find opponents
  - [ ] Match starts correctly

- [ ] **Real-Time Gameplay**
  - [ ] Open two browser windows
  - [ ] Login as different users
  - [ ] Start a match
  - [ ] Make a move in one window
  - [ ] Verify move appears instantly in other window

- [ ] **Chess Features**
  - [ ] Board renders correctly
  - [ ] Legal move validation works
  - [ ] Stockfish challenges generate
  - [ ] Sounds play correctly
  - [ ] Game over detection works

- [ ] **Performance**
  - [ ] Page loads quickly (<3 seconds)
  - [ ] Real-time latency acceptable (<500ms)
  - [ ] No console errors

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://your-app.vercel.app` |
| `PUSHER_APP_ID` | Pusher application ID | `123456` |
| `PUSHER_KEY` | Pusher API key | `abc123def456` |
| `PUSHER_SECRET` | Pusher API secret | `secret123` |
| `PUSHER_CLUSTER` | Pusher cluster region | `us2`, `eu`, `ap1` |
| `NEXT_PUBLIC_PUSHER_KEY` | Public Pusher key (same as PUSHER_KEY) | `abc123def456` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Public cluster (same as PUSHER_CLUSTER) | `us2` |

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Common Issues

### 1. Database Connection Errors

**Problem:** `Error: P1001: Can't reach database server`

**Solution:**
- Verify DATABASE_URL is correct
- Check database is publicly accessible
- For Neon, use connection pooling URL
- Check firewall/network settings

### 2. Pusher Connection Failed

**Problem:** `[Pusher] Error: Connection failed`

**Solution:**
- Verify Pusher credentials are correct
- Check `NEXT_PUBLIC_*` variables are set
- Verify Pusher cluster matches your app region
- Check browser console for specific errors

### 3. Build Failures

**Problem:** `Build failed with exit code 1`

**Solution:**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Run `npm install` and `npm run build` locally first
- Check TypeScript errors with `npm run lint`

### 4. Migrations Not Applied

**Problem:** Database tables don't exist

**Solution:**
```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Run migrations
npx prisma migrate deploy

# Or reset and migrate (WARNING: deletes data)
npx prisma migrate reset --force
```

### 5. Real-Time Not Working

**Problem:** Moves don't sync between players

**Solution:**
- Check Pusher dashboard for message activity
- Verify both `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY` are set
- Check browser console for connection errors
- Verify match ID is being passed to RealtimeProvider

## Monitoring

### Vercel Dashboard
- **Deployments:** View build logs and deployment history
- **Analytics:** Track page views and performance
- **Logs:** Real-time function logs (Runtime Logs tab)

### Pusher Dashboard
- **Debug Console:** Monitor real-time messages
- **Analytics:** Track connection count and message volume
- **Limits:** Monitor free tier usage

### Database Monitoring
- **Neon:** Dashboard shows connection count, query performance
- **Supabase:** Table editor, SQL editor, logs
- **Railway:** Metrics tab shows database stats

## Scaling Considerations

### Pusher Limits
- **Free Tier:** 200k messages/day, 100 connections
- **Upgrade at:** ~50+ concurrent games
- **Cost:** $49/month for 500 connections

### Database Limits
- **Neon Free:** 0.5GB storage, 3GB data transfer
- **Upgrade at:** ~1000 users or heavy usage
- **Cost:** $19/month for 10GB storage

### Vercel Limits
- **Free Tier:** 100GB bandwidth, 1000 serverless function invocations/day
- **Upgrade at:** High traffic (>10k monthly users)
- **Cost:** $20/month for Pro plan

## Rollback Procedure

If deployment fails or introduces bugs:

1. **Revert to previous deployment**
   ```bash
   vercel rollback
   ```

2. **Or via dashboard**
   - Go to Deployments tab
   - Find previous working deployment
   - Click "..." > "Promote to Production"

3. **Database rollback** (if migrations were applied)
   ```bash
   # Revert migration
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

## Custom Domain Setup

1. **Add domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update NEXTAUTH_URL**
   - Change from `https://your-app.vercel.app`
   - To `https://yourdomain.com`
   - Redeploy

## Security Best Practices

- [ ] Never commit `.env.local` or environment variables to Git
- [ ] Use strong, unique `NEXTAUTH_SECRET`
- [ ] Rotate Pusher secret if compromised
- [ ] Enable 2FA on Vercel, Pusher, and database accounts
- [ ] Monitor error logs for suspicious activity
- [ ] Keep dependencies updated (`npm audit`)

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Pusher Docs:** [pusher.com/docs](https://pusher.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)

---

**Deployment Status:** ✅ Ready for Production

**Last Updated:** 2025-09-30