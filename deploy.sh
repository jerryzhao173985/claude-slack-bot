#!/bin/bash

echo "🚀 Deploying Claude Slack Bot"
echo "============================"
echo ""

# Check configuration
echo "📋 Checking configuration..."
if grep -q "claude-code-processor.yml" wrangler.toml; then
    echo "✅ Using correct workflow: claude-code-processor.yml"
else
    echo "❌ ERROR: Wrong workflow in wrangler.toml!"
    echo "   Please ensure it uses: claude-code-processor.yml"
    exit 1
fi

# Check for required secrets
echo ""
echo "📝 Required secrets (ensure these are set):"
echo "   Cloudflare:"
echo "   - SLACK_SIGNING_SECRET"
echo "   - SLACK_BOT_TOKEN"
echo "   - GITHUB_TOKEN"
echo ""
echo "   GitHub:"
echo "   - ANTHROPIC_API_KEY"
echo "   - SLACK_BOT_TOKEN"
echo "   - SLACK_TEAM_ID"
echo "   - NOTION_KEY (for Q&A history)"
echo "   - GH_TOKEN"
echo ""

# Deploy
echo "🔄 Deploying to Cloudflare Workers..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Test in Slack: @claude hello"
    echo "2. Check Notion for 'Claude Code' folder"
    echo "3. Monitor logs: wrangler tail"
    echo "4. Check GitHub Actions for workflow runs"
    echo ""
    echo "✨ Features:"
    echo "   Model Selection:"
    echo "   - @claude /model advanced analyze this code"
    echo "   - @claude fast mode what's 2+2?"
    echo ""
    echo "   Notion Integration:"
    echo "   - All Q&As saved automatically"
    echo "   - Check 'Claude Code' folder in Notion"
else
    echo ""
    echo "❌ Deployment failed! Check the error above."
    exit 1
fi