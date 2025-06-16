#!/bin/bash

echo "🔍 Debugging Claude Slack Bot Workflow Configuration"
echo "==================================================="
echo ""

# Check Cloudflare configuration
echo "1. Checking Cloudflare Worker Configuration..."
echo "   Getting GITHUB_WORKFLOW_FILE secret..."
wrangler secret list 2>/dev/null | grep -E "(GITHUB_WORKFLOW_FILE|GITHUB_OWNER|GITHUB_REPO)" || echo "   No workflow file configured!"
echo ""

# Check GitHub workflows
echo "2. Checking GitHub Workflows..."
echo "   Looking for the workflow that's actually running..."
echo ""

# Show recent GitHub Actions runs
echo "3. Recent GitHub Actions (check which workflow name is running):"
echo "   Go to: https://github.com/jerryzhao173985/claude-slack-bot/actions"
echo "   Look for 'Claude Code Processor' vs 'Claude Code Processor Ultimate'"
echo ""

# Check the key difference in workflows
echo "4. Key Differences Between Workflows:"
echo ""
echo "   Basic 'Claude Code Processor':"
echo "   - allowed_tools: \"ALL\" (DOESN'T WORK)"
echo "   - May have old model name"
echo ""
echo "   'Claude Code Processor Ultimate':"
echo "   - allowed_tools: \"mcp__slack__...,Write,Bash,...\" (WORKS)"
echo "   - Correct model: claude-3-5-sonnet-20241022"
echo "   - Lists all MCP tools individually"
echo ""

# Show how to fix
echo "5. TO FIX RIGHT NOW:"
echo ""
echo "   Option A - Use Ultimate Workflow:"
echo "   $ wrangler secret delete GITHUB_WORKFLOW_FILE"
echo "   $ wrangler secret put GITHUB_WORKFLOW_FILE"
echo "   Enter: claude-code-processor-ultimate.yml"
echo ""
echo "   Option B - Use Direct API (100% Reliable):"
echo "   $ wrangler secret put GITHUB_WORKFLOW_FILE"
echo "   Enter: claude-code-direct-api.yml"
echo ""

# Check environment
echo "6. Verifying Your Setup:"
if [ -f ".github/workflows/claude-code-processor-ultimate.yml" ]; then
    echo "   ✅ Ultimate workflow exists"
    grep "allowed_tools:" .github/workflows/claude-code-processor-ultimate.yml | head -1
else
    echo "   ❌ Ultimate workflow missing!"
fi

if [ -f ".github/workflows/claude-code-direct-api.yml" ]; then
    echo "   ✅ Direct API workflow exists"
else
    echo "   ❌ Direct API workflow missing!"
fi

echo ""
echo "🎯 Most Likely Issue: You're running the basic workflow with ALL permissions"
echo "   which doesn't work due to the documentation bug!"