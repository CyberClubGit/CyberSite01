#!/bin/sh
set -e
echo "Starting build process..."
npm run build
echo "Build complete. Preparing for deployment..."
if [ -d ".next/standalone" ]; then
  echo "Standalone directory found. Creating target directory..."
  mkdir -p .next/standalone/.next
else
  echo "Error: .next/standalone directory not found after build."
  exit 1
fi
if [ -f ".next/routes-manifest.json" ]; then
  echo "Routes manifest found. Copying to standalone directory..."
  cp .next/routes-manifest.json .next/standalone/.next/
else
  echo "Error: .next/routes-manifest.json not found after build."
  exit 1
fi
echo "Deployment package prepared successfully."
echo "Final structure of .next/standalone:"
ls -R .next/standalone
