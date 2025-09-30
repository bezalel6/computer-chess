@echo off
REM Computer Chess - Next.js Setup Script (Windows)
REM This script automates the initial setup process

echo.
echo 🎮 Computer Chess - Next.js Setup
echo ==================================
echo.

REM Check Node.js
echo Checking Node.js version...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js not found. Please install Node.js 20+ from nodejs.org
    exit /b 1
)
echo ✅ Node.js version OK
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Error installing dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Check for .env.local
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy .env.example .env.local >nul
    echo ✅ .env.local created
    echo.
    echo ⚠️  IMPORTANT: Update .env.local with your settings:
    echo    - DATABASE_URL: Your PostgreSQL connection string
    echo    - NEXTAUTH_SECRET: Run this command to generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    echo.
) else (
    echo ✅ .env.local already exists
    echo.
)

REM Ask about database setup
set /p SETUP_DB="Do you have PostgreSQL running and want to set up the database now? (y/n): "
if /i "%SETUP_DB%"=="y" (
    echo 🗄️  Setting up database...

    echo Pushing Prisma schema...
    call npm run db:push
    if errorlevel 1 (
        echo ❌ Error pushing schema. Check your DATABASE_URL in .env.local
        exit /b 1
    )
    echo ✅ Schema pushed
    echo.

    echo Generating Prisma client...
    call npm run db:generate
    if errorlevel 1 (
        echo ❌ Error generating Prisma client
        exit /b 1
    )
    echo ✅ Prisma client generated
    echo.

    set /p SEED_DB="Do you want to seed the database with test data? (y/n): "
    if /i "!SEED_DB!"=="y" (
        echo 🌱 Seeding database...
        call npm run db:seed
        if errorlevel 1 (
            echo ❌ Error seeding database
            exit /b 1
        )
        echo ✅ Database seeded
        echo.
        echo 📝 Test accounts created:
        echo    Username: alice ^| Password: password123
        echo    Username: bob   ^| Password: password123
        echo.
    )
) else (
    echo ⚠️  Skipping database setup. Run these commands when ready:
    echo    npm run db:push
    echo    npm run db:generate
    echo    npm run db:seed  (optional)
    echo.
)

echo ✨ Setup complete!
echo.
echo 🚀 To start the development server:
echo    npm run dev
echo.
echo 📚 For more information, see:
echo    - README.md
echo    - MIGRATION_GUIDE.md
echo.