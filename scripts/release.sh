#!/bin/bash
set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: pnpm run release <version> (e.g. 0.1.0)"
  exit 1
fi

echo "Releasing v$VERSION..."

# Run checks
pnpm test
pnpm build

# Tag and push
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "Tag v$VERSION pushed! GitHub Actions will handle the npm publish."
