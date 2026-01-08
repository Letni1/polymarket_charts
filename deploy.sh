#!/bin/bash

# Simple deployment script for GitHub Pages
# This script builds the project and deploys to gh-pages branch

echo "Building the project..."
npm run build

echo "Deploying to GitHub Pages..."
npx gh-pages -d dist

echo "Deployment complete! Your site should be available at:"
echo "https://[your-username].github.io/[repository-name]/"