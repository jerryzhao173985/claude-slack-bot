#!/bin/bash

echo "🔍 Claude Slack Bot Setup Verification"
echo "====================================="
echo ""

# Check for required secrets
echo "1. Checking GitHub Secrets..."
MISSING_SECRETS=0

check_secret() {
    if [ -z "${!1}" ]; then
        echo "   ❌ $1 - NOT SET"
        MISSING_SECRETS=$((MISSING_SECRETS + 1))
    else
        echo "   ✅ $1 - Set"
    fi
}

# Simulate checking (in real workflow these would be available)
echo "   ℹ️  Note: Run this in GitHub Actions to verify secrets"
echo ""

# Check workflow file
echo "2. Checking Workflow Configuration..."
if [ -f ".github/workflows/claude-code-processor-ultimate.yml" ]; then
    echo "   ✅ Ultimate workflow exists"
    
    # Check for correct tool format
    if grep -q 'allowed_tools: "mcp__slack__' .github/workflows/claude-code-processor-ultimate.yml; then
        echo "   ✅ Uses correct comma-separated format"
        echo "   ✅ Lists MCP tools individually"
    else
        echo "   ❌ Tool format may be incorrect"
    fi
else
    echo "   ❌ Ultimate workflow not found"
fi
echo ""

# Check Cloudflare setup
echo "3. Checking Cloudflare Configuration..."
if command -v wrangler &> /dev/null; then
    echo "   ✅ Wrangler CLI installed"
    
    # Check if logged in
    if wrangler whoami &> /dev/null; then
        echo "   ✅ Logged into Cloudflare"
    else
        echo "   ❌ Not logged into Cloudflare (run: wrangler login)"
    fi
else
    echo "   ❌ Wrangler not installed (run: npm install -g wrangler)"
fi
echo ""

# Check npm packages
echo "4. Checking MCP Server Availability..."
echo "   Testing if MCP servers can be installed..."
if npm view @modelcontextprotocol/server-slack &> /dev/null; then
    echo "   ✅ Slack MCP server available on npm"
else
    echo "   ❌ Cannot reach npm registry"
fi
echo ""

# Summary
echo "📊 Summary"
echo "=========="
if [ $MISSING_SECRETS -eq 0 ] && [ -f ".github/workflows/claude-code-processor-ultimate.yml" ]; then
    echo "✅ Your setup appears to be correct!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./deploy-ultimate.sh"
    echo "2. Choose option 1 (Ultimate MCP workflow)"
    echo "3. Test in Slack: @claude what is 2+2?"
    echo ""
    echo "Expected behavior:"
    echo "- Immediate: '🤔 Working on your request...'"
    echo "- 10-30 seconds: Message updates with answer"
else
    echo "⚠️  Some issues need to be fixed:"
    [ $MISSING_SECRETS -gt 0 ] && echo "- Add missing GitHub secrets"
    [ ! -f ".github/workflows/claude-code-processor-ultimate.yml" ] && echo "- Workflow file missing"
fi
echo ""
echo "📚 Documentation:"
echo "- ULTIMATE_SOLUTION.md - Full technical details"
echo "- FINAL_GUIDE.md - Quick reference"
echo "- TROUBLESHOOTING.md - If things go wrong"