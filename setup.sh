#!/bin/bash

# Computer Chess - Next.js Setup Script
# This script automates the initial setup process

set -e

echo "🎮 Computer Chess - Next.js Setup"
echo "=================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local

    # Generate NEXTAUTH_SECRET
    secret=$(openssl rand -base64 32)

    # Update .env.local with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|dev-secret-change-in-production|$secret|g" .env.local
    else
        # Linux
        sed -i "s|dev-secret-change-in-production|$secret|g" .env.local
    fi

    echo "✅ .env.local created with secure secret"
    echo ""
    echo "⚠️  IMPORTANT: Update DATABASE_URL in .env.local with your PostgreSQL connection string"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Ask if user wants to set up database
read -p "Do you have PostgreSQL running and want to set up the database now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Setting up database..."

    # Push schema to database
    echo "Pushing Prisma schema..."
    npm run db:push
    echo "✅ Schema pushed"
    echo ""

    # Generate Prisma client
    echo "Generating Prisma client..."
    npm run db:generate
    echo "✅ Prisma client generated"
    echo ""

    # Ask if user wants to seed
    read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database..."
        npm run db:seed
        echo "✅ Database seeded"
        echo ""
        echo "📝 Test accounts created:"
        echo "   Username: alice | Password: password123"
        echo "   Username: bob   | Password: password123"
        echo ""
    fi
else
    echo "⚠️  Skipping database setup. Run these commands when ready:"
    echo "   npm run db:push"
    echo "   npm run db:generate"
    echo "   npm run db:seed  (optional)"
    echo ""
fi

echo "✨ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📚 For more information, see:"
echo "   - README.md"
echo "   - MIGRATION_GUIDE.md"
echo ""