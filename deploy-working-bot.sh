#!/bin/bash

echo "🚀 Deploying Working Claude Slack Bot"
echo "===================================="
echo ""
echo "This script will deploy the most reliable solution."
echo ""

# Update Cloudflare
echo "📝 Updating Cloudflare configuration..."
echo "Deleting old configuration..."
wrangler secret delete GITHUB_WORKFLOW_FILE 2>/dev/null || true

echo ""
echo "Setting new configuration..."
echo "When prompted, enter: claude-code-direct-api.yml"
echo ""
wrangler secret put GITHUB_WORKFLOW_FILE

# Commit and push
echo ""
echo "📦 Pushing to GitHub..."
git add .
git commit -m "Fix bot with direct API workflow - bypass broken Claude Code action" || echo "No changes to commit"
git push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 To test your bot:"
echo "1. Go to Slack"
echo "2. Type: @claude what is 2+2?"
echo "3. You should see:"
echo "   - '🤔 Working on your request...' (immediately)"
echo "   - '2 + 2 equals 4' (after 10-20 seconds)"
echo ""
echo "📊 If it still doesn't work:"
echo "1. Check GitHub Actions tab for errors"
echo "2. Run: ./test-slack-update.sh YOUR_BOT_TOKEN"
echo "3. Check if your bot has chat:write scope"
echo ""
echo "🎉 Your bot should now be working!"