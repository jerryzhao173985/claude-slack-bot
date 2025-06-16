#!/bin/bash

echo "🚀 Deploying Claude Slack Bot"
echo "============================"
echo ""

# Check configuration
echo "📋 Checking configuration..."
if grep -q "claude-code-processor-ultimate.yml" wrangler.toml; then
    echo "✅ Using correct workflow: claude-code-processor-ultimate.yml"
else
    echo "❌ ERROR: Wrong workflow in wrangler.toml!"
    echo "   Please ensure it uses: claude-code-processor-ultimate.yml"
    exit 1
fi

# Check for required secrets
echo ""
echo "📝 Required secrets (ensure these are set):"
echo "   - SLACK_SIGNING_SECRET (Cloudflare)"
echo "   - SLACK_BOT_TOKEN (Cloudflare & GitHub)"
echo "   - GITHUB_TOKEN (Cloudflare)"
echo "   - ANTHROPIC_API_KEY (GitHub)"
echo "   - SLACK_TEAM_ID (GitHub)"
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
    echo "2. Monitor logs: wrangler tail"
    echo "3. Check GitHub Actions for workflow runs"
    echo ""
    echo "🎯 Model Selection Examples:"
    echo "   @claude /model advanced analyze this code"
    echo "   @claude fast mode what's 2+2?"
    echo "   @claude using sonnet-4 write documentation"
else
    echo ""
    echo "❌ Deployment failed! Check the error above."
    exit 1
fi