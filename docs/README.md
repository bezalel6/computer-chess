# Documentation

All technical documentation has been consolidated here. **21 files total**

## 📁 Directory Structure

```
docs/
├── README.md                           # This file (index)
│
├── Implementation Guides (4)
│   ├── SINGLE_PLAYER_IMPLEMENTATION.md # AI opponent system
│   ├── MIGRATION_GUIDE.md              # CRA to Vite migration
│   ├── QUICK_START.md                  # Quick setup guide
│   └── REALTIME_INTEGRATION.md         # Pusher WebSocket setup
│
├── Deployment (2)
│   ├── DEPLOYMENT.md                   # Production deployment
│   └── DEPLOYMENT_CHECKLIST.md         # Pre-deploy verification
│
├── Fixes & Solutions (5)
│   ├── DATABASE_FIX.md                 # Prisma schema issues
│   ├── NEXTAUTH_V5_FIX.md              # NextAuth v5 migration
│   ├── REACT_CHESSBOARD_V5_FIX.md      # react-chessboard v5 API
│   ├── FIXES_APPLIED.md                # Complete fix log
│   └── RUNTIME_FIXES.md                # Runtime issue resolutions
│
├── Code Quality (3)
│   ├── REFACTORING_SUMMARY.md          # Refactoring overview
│   ├── REFACTORING_CHANGELOG.md        # Line-by-line changes
│   └── MANUAL_REVIEW_ITEMS.md          # Review checklist
│
└── Project Reports (6)
    ├── IMPLEMENTATION_COMPLETE.md      # Feature completion status
    ├── IMPLEMENTATION_FINAL.md         # Final implementation report
    ├── IMPLEMENTATION_SUMMARY.md       # Implementation overview
    ├── PROJECT_COMPLETE.md             # Project milestones
    ├── MIGRATION_COMPARISON.md         # Before/after comparison
    └── FILE_MANIFEST.md                # Complete file inventory
```

## 📚 Quick Links

### 🚀 Getting Started
- **[Quick Start](./QUICK_START.md)** - Fast setup and run
- **[Migration Guide](./MIGRATION_GUIDE.md)** - CRA to Vite details

### 🎮 Features
- **[Single-Player AI](./SINGLE_PLAYER_IMPLEMENTATION.md)** - Play vs AI (4 difficulty levels)
- **[Realtime Integration](./REALTIME_INTEGRATION.md)** - Pusher WebSocket multiplayer

### 🚢 Deployment
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment steps
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-deploy verification

### 🔧 Troubleshooting
- **[Database Fix](./DATABASE_FIX.md)** - Prisma issues
- **[NextAuth v5 Fix](./NEXTAUTH_V5_FIX.md)** - Auth migration
- **[React Chessboard Fix](./REACT_CHESSBOARD_V5_FIX.md)** - Board component v5
- **[All Fixes Applied](./FIXES_APPLIED.md)** - Complete fix history
- **[Runtime Fixes](./RUNTIME_FIXES.md)** - Runtime solutions

### 📊 Code Quality
- **[Refactoring Summary](./REFACTORING_SUMMARY.md)** - Improvements overview
- **[Refactoring Changelog](./REFACTORING_CHANGELOG.md)** - Detailed changes
- **[Manual Review Items](./MANUAL_REVIEW_ITEMS.md)** - Review priorities

### 📋 Project Status
- **[Implementation Complete](./IMPLEMENTATION_COMPLETE.md)** - Features done
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overview
- **[Project Complete](./PROJECT_COMPLETE.md)** - Milestones achieved
- **[Migration Comparison](./MIGRATION_COMPARISON.md)** - Before/after
- **[File Manifest](./FILE_MANIFEST.md)** - File inventory

---

## 📝 Documentation Standards

All docs follow these standards:
- ✅ GitHub-flavored markdown
- ✅ Clear structure with navigation
- ✅ Code examples where relevant
- ✅ Status indicators (✅ ⚠️ ❌)

## 🔄 Contributing

When adding documentation:
1. Place new `.md` files in `/docs`
2. Update this README index
3. Use descriptive filenames
4. Follow existing format

---

**Root directory policy:** Only `README.md` and `CLAUDE.md` in project root. All other docs go here.

**Last Updated:** 2025-09-30