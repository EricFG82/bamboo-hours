#!/usr/bin/env bash
set -euo pipefail

DATE="${1:-$(date +%F)}"
NOTE="${2:-}"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."

  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
  elif command -v npm >/dev/null 2>&1; then
    npm install
  else
    echo "No package manager found (pnpm or npm)"
    exit 1
  fi

  echo "Installing Playwright browser..."
  npx playwright install chromium
fi

node fill-hours.js "$DATE" "$NOTE"
