#!/bin/bash
# MY STUDIO — Project Setup Script
# Run this after cloning the repository

set -e
echo "=== MY STUDIO Setup ==="

# Install root dependencies
echo "Installing dependencies..."
npm install

# Copy env example if no .env exists
if [ ! -f .env ]; then
  cp packages/config/environments/personal.env.example .env
  echo "Created .env from template — fill in your credentials"
fi

echo ""
echo "Setup complete!"
echo "Next steps:"
echo "  1. Fill in .env with your credentials"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
