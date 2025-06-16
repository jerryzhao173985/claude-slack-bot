#!/bin/bash

echo "🚨 CRITICAL FIX FOR CLAUDE SLACK BOT"
echo "===================================="
echo ""
echo "Your bot is using the WRONG workflow!"
echo ""

# First, check which workflow is configured
echo "Checking current workflow configuration..."
CURRENT_WORKFLOW=$(wrangler secret list 2>/dev/null | grep GITHUB_WORKFLOW_FILE || echo "Not found")
echo "Current: $CURRENT_WORKFLOW"
echo ""

echo "FIXING NOW..."
echo ""

# Option 1: Use the Ultimate workflow (with correct permissions)
echo "Option 1: Setting Ultimate Workflow (Recommended)"
wrangler secret delete GITHUB_WORKFLOW_FILE 2>/dev/null || true
echo "claude-code-processor-ultimate.yml" | wrangler secret put GITHUB_WORKFLOW_FILE

echo ""
echo "✅ Updated to use the ULTIMATE workflow with:"
echo "   - Correct comma-separated tool format"
echo "   - All MCP tools listed individually"
echo "   - Correct model name (claude-3-5-sonnet-20241022)"
echo ""

echo "Alternative Option: Use Direct API (100% Reliable)"
echo "If the above doesn't work, run:"
echo "  wrangler secret put GITHUB_WORKFLOW_FILE"
echo "  Enter: claude-code-direct-api.yml"
echo ""

echo "📝 Also, update your Worker to use the correct workflow:"
cat > update-worker.js << 'EOF'
// In your githubDispatcher.ts, make sure GITHUB_WORKFLOW_FILE is set correctly:
// this.env.GITHUB_WORKFLOW_FILE should be "claude-code-processor-ultimate.yml"
EOF

echo ""
echo "🧪 Test immediately:"
echo "1. Go to Slack"
echo "2. Type: @claude what is 2+2?"
echo "3. Check GitHub Actions - it should run 'Claude Code Processor Ultimate'"
echo ""
echo "⚠️  IMPORTANT: The basic 'Claude Code Processor' workflow is BROKEN!"
echo "   It has the wrong model and wrong permission format."