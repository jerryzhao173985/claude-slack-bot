#!/bin/bash

echo "=== Testing Claude Slack Bot GitHub Dispatch ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Worker URL
echo "1. Checking Worker URL..."
WORKER_URL=$(wrangler deployments list | grep -A1 "Created:" | grep -oE "https://[^ ]+\.workers\.dev" | head -1)
if [ -z "$WORKER_URL" ]; then
  echo -e "${RED}❌ Could not find Worker URL${NC}"
  echo "   Please run: wrangler deploy"
  exit 1
fi
echo -e "${GREEN}✅ Worker URL: $WORKER_URL${NC}"

# Step 2: Test debug endpoint
echo ""
echo "2. Testing debug endpoint..."
echo "   Calling: $WORKER_URL/debug/config"
DEBUG_RESPONSE=$(curl -s "$WORKER_URL/debug/config")
echo "$DEBUG_RESPONSE" | jq . || echo "$DEBUG_RESPONSE"

# Step 3: Test workflow dispatch
echo ""
echo "3. Testing workflow dispatch directly..."
echo "   Calling: $WORKER_URL/debug/test-dispatch"
DISPATCH_RESPONSE=$(curl -s "$WORKER_URL/debug/test-dispatch")
echo "$DISPATCH_RESPONSE" | jq . || echo "$DISPATCH_RESPONSE"

# Step 4: Check GitHub Actions
echo ""
echo "4. Recent GitHub Actions runs..."
# Read config from wrangler.toml
GITHUB_OWNER=$(grep GITHUB_OWNER wrangler.toml | cut -d'"' -f2)
GITHUB_REPO=$(grep GITHUB_REPO wrangler.toml | cut -d'"' -f2)

if [ ! -z "$GITHUB_TOKEN" ]; then
  RUNS=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/runs?per_page=5" | \
    jq -r '.workflow_runs[] | "\(.created_at) - \(.name) - \(.status)"')
  echo "$RUNS"
else
  echo -e "${YELLOW}⚠️  Set GITHUB_TOKEN to see recent runs${NC}"
  echo "   export GITHUB_TOKEN='your-pat-token'"
fi

# Step 5: Monitor logs
echo ""
echo "5. To monitor Worker logs in real-time:"
echo -e "${YELLOW}   wrangler tail${NC}"
echo ""
echo "6. To test from Slack:"
echo "   @claude test github dispatch"
echo ""
echo "=== Test complete ==="