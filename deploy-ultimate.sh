#!/bin/bash

echo "🚀 Deploying Ultimate Claude Slack Bot Solution"
echo "=============================================="
echo ""
echo "Based on community research and confirmed working patterns"
echo ""

# Show options
echo "Choose your deployment strategy:"
echo ""
echo "1) Ultimate MCP - Full MCP support with correct permissions (Recommended)"
echo "2) Simple Perms - Basic 'Bash Edit Write' format"
echo "3) Direct API - Bypass Claude Code entirely (Most Reliable)"
echo ""
read -p "Enter your choice (1-3) [default: 1]: " choice
choice=${choice:-1}

case $choice in
    1)
        WORKFLOW="claude-code-processor-ultimate.yml"
        echo "✅ Selected: Ultimate MCP workflow"
        ;;
    2)
        WORKFLOW="claude-code-processor-simple-perms.yml"
        echo "✅ Selected: Simple permissions workflow"
        ;;
    3)
        WORKFLOW="claude-code-direct-api.yml"
        echo "✅ Selected: Direct API workflow"
        ;;
    *)
        echo "Invalid choice, using Ultimate MCP"
        WORKFLOW="claude-code-processor-ultimate.yml"
        ;;
esac

echo ""
echo "📝 Updating Cloudflare configuration..."
wrangler secret delete GITHUB_WORKFLOW_FILE 2>/dev/null || true
echo "Setting workflow to: $WORKFLOW"
wrangler secret put GITHUB_WORKFLOW_FILE <<< "$WORKFLOW"

echo ""
echo "📦 Committing and pushing changes..."
git add .
git commit -m "Deploy ultimate solution with $WORKFLOW

Based on community research:
- Uses correct comma-separated tool format
- Lists MCP tools individually (no wildcards)
- Implements proper fallback handling" || echo "No changes to commit"

git push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test your bot:"
echo "1. Go to Slack"
echo "2. Type: @claude what is 2+2?"
echo "3. Expected behavior:"
echo "   - Immediate: '🤔 Working on your request...'"
echo "   - 10-30 seconds: Message updates to '2 + 2 equals 4'"
echo ""
echo "📊 Monitor progress:"
echo "- Cloudflare logs: wrangler tail"
echo "- GitHub Actions: Check Actions tab"
echo "- Slack: Watch for response"
echo ""
echo "💡 If it doesn't work:"
echo "1. Try option 3 (Direct API)"
echo "2. Check TROUBLESHOOTING.md"
echo "3. Verify bot has chat:write scope"
echo ""
echo "🎉 Your bot should now be working with proper permissions!"