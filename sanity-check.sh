#!/bin/bash

echo "🔍 Sanity Check Before Deployment"
echo "=================================="
echo ""

# Check wrangler.toml
echo "1. Checking wrangler.toml configuration..."
if grep -q "claude-code-processor-ultimate.yml" wrangler.toml; then
    echo "   ✅ Using Ultimate workflow (GOOD)"
else
    echo "   ❌ Not using Ultimate workflow!"
    grep "GITHUB_WORKFLOW_FILE" wrangler.toml
fi
echo ""

# Check if ultimate workflow exists
echo "2. Checking if Ultimate workflow exists..."
if [ -f ".github/workflows/claude-code-processor-ultimate.yml" ]; then
    echo "   ✅ Ultimate workflow file exists"
    echo "   Checking permission format..."
    if grep -q 'allowed_tools: "mcp__slack__' .github/workflows/claude-code-processor-ultimate.yml; then
        echo "   ✅ Uses correct comma-separated format"
    else
        echo "   ❌ Wrong permission format!"
    fi
else
    echo "   ❌ Ultimate workflow missing!"
fi
echo ""

# Check secrets
echo "3. Checking required secrets..."
echo "   Run: wrangler secret list"
echo "   Should have:"
echo "   - SLACK_SIGNING_SECRET"
echo "   - SLACK_BOT_TOKEN"  
echo "   - GITHUB_TOKEN"
echo ""

# Summary
echo "4. Ready to deploy?"
if grep -q "claude-code-processor-ultimate.yml" wrangler.toml && [ -f ".github/workflows/claude-code-processor-ultimate.yml" ]; then
    echo "   ✅ YES! Run: ./DEPLOY_FIX_NOW.sh"
else
    echo "   ❌ NO! Something is wrong, check above"
fi
echo ""

echo "5. After deployment:"
echo "   - Test in Slack: @claude what is 2+2?"
echo "   - Check GitHub Actions for 'Claude Code Processor Ultimate'"
echo "   - Monitor with: wrangler tail"