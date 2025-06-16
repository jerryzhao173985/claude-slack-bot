#!/bin/bash

# Quick fix script for Claude Slack Bot message updates

echo "🔧 Fixing Claude Slack Bot message updates..."
echo ""
echo "This script will configure your bot to properly update Slack messages."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler is not installed"
    echo "Please run: npm install -g wrangler"
    exit 1
fi

echo "Choose your preferred solution:"
echo ""
echo "1) Best Experience (Recommended) - Full MCP support with message updates"
echo "2) Simple & Fast - Direct API calls, no MCP"
echo "3) Thread Replies - Uses available MCP tools"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        WORKFLOW="claude-code-processor-best.yml"
        echo "✅ Selected: Best Experience workflow"
        ;;
    2)
        WORKFLOW="claude-code-processor-direct.yml"
        echo "✅ Selected: Simple & Fast workflow"
        ;;
    3)
        WORKFLOW="claude-code-processor-fixed.yml"
        echo "✅ Selected: Thread Replies workflow"
        ;;
    *)
        echo "❌ Invalid choice. Using recommended workflow."
        WORKFLOW="claude-code-processor-best.yml"
        ;;
esac

echo ""
echo "🚀 Updating Cloudflare Worker configuration..."
wrangler secret put GITHUB_WORKFLOW_FILE --value "$WORKFLOW"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration updated successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Commit and push these new workflow files to GitHub"
    echo "2. Test your bot by mentioning it in Slack"
    echo "3. The 'Working...' message should now update with Claude's response"
    echo ""
    echo "🎉 Your Claude Slack Bot should now work properly!"
else
    echo ""
    echo "❌ Failed to update configuration"
    echo "Please check your wrangler authentication and try again"
fi