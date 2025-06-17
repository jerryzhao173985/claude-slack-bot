#!/bin/bash

echo "=== Claude Slack Bot Workflow Dispatch Troubleshooting ==="
echo ""

# Check if required environment variables are set
echo "1. Checking environment variables..."
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN is not set. Please export it:"
  echo "   export GITHUB_TOKEN='your-github-pat-token'"
  exit 1
else
  echo "✅ GITHUB_TOKEN is set (length: ${#GITHUB_TOKEN})"
fi

# Read configuration from wrangler.toml
echo ""
echo "2. Reading configuration from wrangler.toml..."
GITHUB_OWNER=$(grep GITHUB_OWNER wrangler.toml | cut -d'"' -f2)
GITHUB_REPO=$(grep GITHUB_REPO wrangler.toml | cut -d'"' -f2)
GITHUB_WORKFLOW_FILE=$(grep GITHUB_WORKFLOW_FILE wrangler.toml | cut -d'"' -f2)

echo "   Owner: $GITHUB_OWNER"
echo "   Repo: $GITHUB_REPO"
echo "   Workflow: $GITHUB_WORKFLOW_FILE"

# Check if workflow file exists
echo ""
echo "3. Checking workflow file..."
WORKFLOW_PATH=".github/workflows/$GITHUB_WORKFLOW_FILE"
if [ -f "$WORKFLOW_PATH" ]; then
  echo "✅ Workflow file exists at $WORKFLOW_PATH"
else
  echo "❌ Workflow file NOT FOUND at $WORKFLOW_PATH"
  echo "   Available workflows:"
  ls -la .github/workflows/
  exit 1
fi

# Test GitHub API authentication
echo ""
echo "4. Testing GitHub API authentication..."
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user)

if [ "$AUTH_TEST" = "200" ]; then
  echo "✅ GitHub authentication successful"
else
  echo "❌ GitHub authentication failed (HTTP $AUTH_TEST)"
  echo "   Please check your token permissions"
  exit 1
fi

# Check repository access
echo ""
echo "5. Checking repository access..."
REPO_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO")

if [ "$REPO_TEST" = "200" ]; then
  echo "✅ Repository access confirmed"
else
  echo "❌ Cannot access repository (HTTP $REPO_TEST)"
  echo "   Check if token has 'repo' scope"
  exit 1
fi

# List workflows
echo ""
echo "6. Listing available workflows..."
echo "   Fetching from: https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/workflows"
WORKFLOWS=$(curl -s \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/workflows")

echo "$WORKFLOWS" | jq -r '.workflows[] | "   - \(.name) (\(.path))"' 2>/dev/null || echo "   Failed to parse workflows"

# Test workflow dispatch
echo ""
echo "7. Testing workflow dispatch..."
DISPATCH_URL="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/workflows/$GITHUB_WORKFLOW_FILE/dispatches"
echo "   URL: $DISPATCH_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "$DISPATCH_URL" \
  -d '{
    "ref": "main",
    "inputs": {
      "question": "Troubleshooting test dispatch",
      "mcp_tools": "slack",
      "slack_channel": "test-channel",
      "slack_ts": "1234567890.123456",
      "slack_thread_ts": "",
      "system_prompt": "Test dispatch from troubleshooting script",
      "model": ""
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "204" ]; then
  echo "✅ Workflow dispatch successful!"
  echo "   Check your Actions tab: https://github.com/$GITHUB_OWNER/$GITHUB_REPO/actions"
else
  echo "❌ Workflow dispatch failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  
  if [ "$HTTP_CODE" = "404" ]; then
    echo ""
    echo "   Possible causes:"
    echo "   - Workflow file name doesn't match exactly (case-sensitive)"
    echo "   - Workflow file has syntax errors"
    echo "   - Repository doesn't have Actions enabled"
  elif [ "$HTTP_CODE" = "403" ]; then
    echo ""
    echo "   Token needs 'workflow' scope for dispatching workflows"
  elif [ "$HTTP_CODE" = "422" ]; then
    echo ""
    echo "   Check if workflow inputs match the expected schema"
  fi
fi

echo ""
echo "8. Cloudflare Worker secrets check..."
echo "   Run this command to check Worker secrets:"
echo "   wrangler secret list"
echo ""
echo "   Required secrets:"
echo "   - SLACK_SIGNING_SECRET"
echo "   - SLACK_BOT_TOKEN"
echo "   - GITHUB_TOKEN"
echo ""
echo "   To add missing GITHUB_TOKEN:"
echo "   wrangler secret put GITHUB_TOKEN"

echo ""
echo "=== Troubleshooting complete ==="