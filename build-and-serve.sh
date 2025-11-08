#!/bin/bash

# Build and serve the game as static files
echo "🔨 Building Cultivation Idle..."
npm run build

echo ""
echo "✅ Build complete!"
echo "📦 Serving static files..."
echo "🌐 Game available at: http://localhost:4173/"
echo ""
echo "Press Ctrl+C to stop"
echo "----------------------------------------"

npx vite preview
