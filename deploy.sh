#!/bin/bash
# ============================================
# 🚀 RentNow - Quick Start (Linux/macOS)
# ============================================
set -e

echo ""
echo "=== RentNow - Quick Start ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Install Node.js 20+"
    exit 1
fi
echo "[OK] Node.js $(node --version)"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "[OK] Dependencies installed"
else
    echo "[OK] Dependencies already installed"
fi

# Check .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "[WARNING] No .env.local found."
    echo "Creating from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "[ACTION REQUIRED] Edit .env.local with your API keys:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - MP_ACCESS_TOKEN"
    echo "  - GEMINI_API_KEY"
    echo ""
    read -p "Press Enter after editing .env.local..."
fi

echo ""
echo "Starting development server..."
echo "Open http://localhost:3000 in your browser"
echo ""
npm run dev
