#!/bin/bash

# Cultivation Idle - Startup Script
echo "🎮 Starting Cultivation Idle..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the dev server
echo "🚀 Launching game server..."
echo "📍 Game will be available at: http://localhost:5173/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

npm run dev
