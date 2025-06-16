#!/bin/bash

echo "🚀 DEPLOYING THE FIX FOR CLAUDE SLACK BOT"
echo "========================================"
echo ""
echo "✅ FOUND THE ISSUE!"
echo "   Your wrangler.toml was hardcoded to use the BROKEN workflow!"
echo "   It was: claude-code-processor.yml (with 'ALL' permissions)"
echo "   Now is: claude-code-processor-ultimate.yml (with proper permissions)"
echo ""

echo "📦 Deploying the fix to Cloudflare..."
echo ""

# Deploy the worker with the corrected configuration
wrangler deploy

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "The bot is now using:"
echo "- Workflow: claude-code-processor-ultimate.yml"
echo "- Permissions: Comma-separated list (WORKS!)"
echo "- Model: claude-3-5-sonnet-20241022"
echo ""

echo "🧪 TEST YOUR BOT NOW:"
echo "1. Go to Slack"
echo "2. Type: @claude what is 2+2?"
echo "3. You should see:"
echo "   - Immediate: '🤔 Working on your request...'"
echo "   - 10-30 seconds later: '4'"
echo ""

echo "📊 Monitor the fix:"
echo "- GitHub Actions: Should show 'Claude Code Processor Ultimate'"
echo "- Cloudflare logs: wrangler tail"
echo ""

echo "🎉 Your bot should finally work properly!"
echo ""
echo "If you still have issues, you can use the Direct API workflow:"
echo "1. Edit wrangler.toml"
echo "2. Change to: GITHUB_WORKFLOW_FILE = \"claude-code-direct-api.yml\""
echo "3. Run: wrangler deploy"