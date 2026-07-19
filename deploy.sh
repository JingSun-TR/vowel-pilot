#!/bin/bash
# Build and deploy to GitHub Pages via gh-pages branch
set -e

echo "Building..."
npx vite build

echo "Deploying to gh-pages branch..."
# Save current branch
MAIN_BRANCH=$(git branch --show-current)

# Create temp work in gh-pages branch
git checkout --orphan gh-pages-deploy
git rm -rf . 2>/dev/null || true
cp dist/index.html index.html
git add index.html
git commit -m "deploy: VowelPilot $(date +%Y-%m-%d)"
git branch -f gh-pages HEAD
git checkout "$MAIN_BRANCH"
git push origin gh-pages --force

echo "Done! https://jingsun-tr.github.io/vowel-pilot/"
