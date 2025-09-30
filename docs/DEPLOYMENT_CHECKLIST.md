# Deployment Checklist

Quick reference checklist for deploying Computer Chess to production.

## Pre-Deployment Setup

### 1. Production Database
- [ ] Create PostgreSQL database (Neon/Supabase/Railway)
- [ ] Copy connection string
- [ ] Test connection locally
- [ ] Save DATABASE_URL securely

**Recommended:** [Neon](https://neon.tech) - Free tier with 0.5GB storage

### 2. Pusher Account
- [ ] Sign up at [pusher.com](https://pusher.com)
- [ ] Create new Channels app
- [ ] Note App ID, Key, Secret, Cluster
- [ ] Test with development environment

**Free Tier:** 200k messages/day, 100 connections

### 3. NextAuth Secret
- [ ] Generate secret: `openssl rand -base64 32`
- [ ] Save securely (password manager)
- [ ] Never commit to git

### 4. Git Repository
- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Verify `.gitignore` excludes `.env.local`
- [ ] Remove any sensitive data from history
- [ ] Tag release version (optional)

---

## Production Deployment

### 1. Choose Your Hosting Provider
Select a Node.js hosting provider (examples: Vercel, Railway, Render, Heroku, DigitalOcean)

- [ ] Create account with chosen provider
- [ ] Install provider's CLI (if available)
- [ ] Navigate to project: `cd computer-chess-next`

### 2. Configure Environment Variables
Add these variables in your hosting provider's dashboard or configuration:

**Database:**
- [ ] `DATABASE_URL` = Your production database URL

**NextAuth:**
- [ ] `NEXTAUTH_SECRET` = Generated secret (openssl)
- [ ] `NEXTAUTH_URL` = Your production URL (e.g., `https://your-app.com`)

**Pusher Server:**
- [ ] `PUSHER_APP_ID` = From Pusher dashboard
- [ ] `PUSHER_KEY` = From Pusher dashboard
- [ ] `PUSHER_SECRET` = From Pusher dashboard
- [ ] `PUSHER_CLUSTER` = From Pusher dashboard (e.g., "us2")

**Pusher Client:**
- [ ] `NEXT_PUBLIC_PUSHER_KEY` = Same as PUSHER_KEY
- [ ] `NEXT_PUBLIC_PUSHER_CLUSTER` = Same as PUSHER_CLUSTER

### 3. Build Configuration
Ensure your hosting provider uses these commands:

- **Build Command:** `npm run build` or `prisma generate && next build`
- **Start Command:** `npm start`
- **Node Version:** 20.x or higher

### 4. Database Migration
```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
```

- [ ] Export DATABASE_URL
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify tables created
- [ ] (Optional) Seed test users

### 5. Deploy to Production
Follow your hosting provider's deployment process:
- [ ] Deploy application
- [ ] Wait for build to complete
- [ ] Note production URL
- [ ] Check deployment logs

---

## Post-Deployment Testing

### Basic Functionality
- [ ] **Homepage loads** - Visit production URL
- [ ] **Registration works** - Create new account
- [ ] **Login works** - Login with created account
- [ ] **Session persists** - Refresh page, still logged in

### Matchmaking
- [ ] **Queue system works** - Click "Find Random Match"
- [ ] **Can enter queue** - No errors in console
- [ ] **Can leave queue** - Cancel button works

### Real-Time Gameplay (Two Devices Required)
- [ ] **Open on two devices** - Mobile + laptop, or two browsers
- [ ] **Login as different users** - User1 and User2
- [ ] **Both find match** - Both click "Find Random Match"
- [ ] **Game starts** - Both see chess board
- [ ] **Moves sync instantly** - User1 move appears on User2 screen
- [ ] **No delay** - Latency <500ms
- [ ] **Bidirectional** - User2 move appears on User1 screen

### Challenge System
- [ ] **Challenges generate** - After making moves
- [ ] **Challenge attempts work** - Click suggested moves
- [ ] **Success detection** - Green checkmark for correct
- [ ] **Failure detection** - Red X for incorrect
- [ ] **Score updates** - Points added to total

### Sound System
- [ ] **Sounds enabled** - Check volume is on
- [ ] **Move sound** - Plays on piece move
- [ ] **Capture sound** - Plays on capture
- [ ] **Check sound** - Plays on check
- [ ] **Challenge sounds** - Success/fail sounds play

### Game Over
- [ ] **Checkmate detected** - Forced checkmate works
- [ ] **Stalemate detected** - Test stalemate position
- [ ] **Winner announced** - Correct winner shown
- [ ] **Game over UI** - Dialog appears

### Mobile Responsiveness
- [ ] **Mobile layout** - UI adapts to small screens
- [ ] **Touch controls** - Can drag pieces on mobile
- [ ] **Readable text** - Font sizes appropriate
- [ ] **No horizontal scroll** - Fits screen width

---

## Monitoring Setup

### Hosting Provider Dashboard
- [ ] Open project in hosting dashboard
- [ ] Bookmark deployment URL
- [ ] Enable email notifications (optional)
- [ ] Check analytics/metrics section

**Monitor:**
- Deployment status
- Runtime logs
- Error tracking
- Performance metrics

### Pusher Dashboard
- [ ] Open Pusher dashboard
- [ ] Select your app
- [ ] Open "Debug Console"
- [ ] Monitor message activity

**Watch for:**
- Connection count
- Message volume
- Error rate
- Daily usage

### Database Monitoring
- [ ] Access database dashboard
- [ ] Check connection count
- [ ] Monitor query performance
- [ ] Set up usage alerts

---

## Troubleshooting

### Deployment Failed
```bash
# Check build logs (via hosting provider dashboard)

# Rebuild locally
npm run build

# Check for errors
npm run lint
```

### Database Connection Error
- [ ] Verify DATABASE_URL is correct
- [ ] Check database is publicly accessible
- [ ] Test connection: `npx prisma db pull`
- [ ] Check IP whitelist (if applicable)

### Pusher Not Connecting
- [ ] Verify all Pusher env vars set
- [ ] Check `NEXT_PUBLIC_*` variables exist
- [ ] Verify cluster matches Pusher dashboard
- [ ] Check browser console for errors
- [ ] Test in Pusher Debug Console

### Moves Not Syncing
- [ ] Check Pusher Debug Console for events
- [ ] Verify matchId is passed to RealtimeProvider
- [ ] Check browser console for errors
- [ ] Test with two different browsers
- [ ] Verify both users in same match

### Authentication Issues
- [ ] Verify NEXTAUTH_SECRET is set
- [ ] Check NEXTAUTH_URL matches deployment
- [ ] Clear cookies and retry
- [ ] Test in incognito mode
- [ ] Check runtime logs for errors

---

## Security Checklist

- [ ] **NEXTAUTH_SECRET** is strong and unique
- [ ] **No secrets** in git repository
- [ ] **CORS** properly configured (automatic with Next.js)
- [ ] **Database** has strong password
- [ ] **Environment variables** not exposed to client (except NEXT_PUBLIC_*)
- [ ] **Prisma** configured for production
- [ ] **Pusher secret** not in browser code

---

## Performance Optimization

### Initial Launch
- [ ] Set up analytics tracking (optional)
- [ ] Set up Sentry error tracking (optional)
- [ ] Monitor Pusher usage
- [ ] Check database query performance

### If Experiencing Issues
- [ ] Enable Prisma connection pooling
- [ ] Optimize slow database queries
- [ ] Add database indexes
- [ ] Upgrade Pusher plan if needed
- [ ] Use CDN for static assets

---

## Rollback Procedure

If deployment has critical issues:

### Via Hosting Provider
Consult your hosting provider's documentation for rollback procedures. Most providers support:
1. Go to Deployments tab
2. Find previous working deployment
3. Revert or promote that deployment to production

### Database Rollback
```bash
# If migrations caused issues
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Custom Domain (Optional)

### Setup
1. Go to your hosting provider's domain settings
2. Add custom domain
3. Follow DNS configuration instructions provided by your host

### Update Environment
- [ ] Update NEXTAUTH_URL to custom domain
- [ ] Redeploy application
- [ ] Test with new domain

---

## Post-Launch

### First 24 Hours
- [ ] Monitor error logs hourly
- [ ] Check Pusher message count
- [ ] Monitor database connections
- [ ] Test from multiple locations
- [ ] Gather user feedback

### First Week
- [ ] Review analytics
- [ ] Check Pusher usage trend
- [ ] Monitor database performance
- [ ] Plan scaling if needed
- [ ] Address user-reported issues

### Ongoing
- [ ] Weekly: Check error logs
- [ ] Monthly: Review usage metrics
- [ ] Quarterly: Update dependencies
- [ ] As needed: Scale infrastructure

---

## Success Criteria

Your deployment is successful when:

- ✅ Application loads without errors
- ✅ Users can register and login
- ✅ Matchmaking connects players
- ✅ Moves sync in real-time (<500ms)
- ✅ Challenges generate and validate
- ✅ Sounds play correctly
- ✅ Game over detection works
- ✅ Mobile experience is smooth
- ✅ No errors in production logs
- ✅ Pusher shows active connections

---

## Support Resources

- **Pusher Docs:** [pusher.com/docs](https://pusher.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Pusher Support:** [support.pusher.com](https://support.pusher.com)

---

**Estimated Time:** 30-45 minutes for first deployment

**Status After Completion:** 🚀 **LIVE IN PRODUCTION**