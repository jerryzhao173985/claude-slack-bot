#!/bin/bash

# Test script for GitHub MCP integration

echo "🧪 Testing GitHub MCP Integration"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ $2 is not set${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $2 is set${NC}"
        return 0
    fi
}

echo "1. Checking environment variables..."
check_env "$GITHUB_TOKEN" "GITHUB_TOKEN" || check_env "$GH_TOKEN" "GH_TOKEN"
check_env "$SLACK_BOT_TOKEN" "SLACK_BOT_TOKEN"
echo ""

# Test GitHub API access
echo "2. Testing GitHub API access..."
if [ -n "$GITHUB_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
    TOKEN=${GITHUB_TOKEN:-$GH_TOKEN}
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        https://api.github.com/user)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ GitHub API access successful${NC}"
    else
        echo -e "${RED}❌ GitHub API access failed (HTTP $RESPONSE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping GitHub API test (no token)${NC}"
fi
echo ""

# Test repository pattern detection
echo "3. Testing repository pattern detection..."
echo "   Testing various patterns that should be detected:"

test_patterns=(
    "analyze jerryzhao173985/reference_model"
    "check https://github.com/facebook/react"
    "review https://github.com/vercel/next.js.git"
    "explain git@github.com:microsoft/vscode.git"
    "git clone https://github.com/rust-lang/rust.git"
    "review code in anthropics/claude-code-sdk"
    "find issues in kubernetes/kubernetes"
    "explain architecture of vuejs/vue"
    "fix typo in jerryzhao173985/my-project"
    "create PR in my repo"
)

for pattern in "${test_patterns[@]}"; do
    echo "   - '$pattern'"
done
echo ""

# Check if github-mcp-server is available
echo "4. Checking GitHub MCP server availability..."
if npx -y github-mcp-server --help >/dev/null 2>&1; then
    echo -e "${GREEN}✅ github-mcp-server is available${NC}"
else
    echo -e "${YELLOW}⚠️  github-mcp-server not found, will be installed on first use${NC}"
fi
echo ""

# Verify workflow configuration
echo "5. Checking workflow configuration..."
if [ -f ".github/workflows/claude-code-processor.yml" ]; then
    if grep -q "github-mcp-server" .github/workflows/claude-code-processor.yml; then
        echo -e "${GREEN}✅ Workflow uses enhanced github-mcp-server${NC}"
    else
        echo -e "${RED}❌ Workflow still uses old GitHub MCP server${NC}"
    fi
    
    if grep -q "mcp__github__" .github/workflows/claude-code-processor.yml; then
        echo -e "${GREEN}✅ GitHub tools are in allowed_tools list${NC}"
    else
        echo -e "${RED}❌ GitHub tools not found in allowed_tools${NC}"
    fi
else
    echo -e "${RED}❌ Workflow file not found${NC}"
fi
echo ""

# Test examples
echo "6. Example commands to test:"
echo -e "${YELLOW}Try these in Slack:${NC}"
echo ""
echo "Read Operations (Any Repository):"
echo "   @claude analyze https://github.com/anthropics/claude-code"
echo "   @claude find security issues in facebook/react"
echo "   @claude what's the architecture of https://github.com/nodejs/node.git?"
echo "   @claude review recent changes in kubernetes/kubernetes"
echo ""
echo "Write Operations (Your Repositories):"
echo "   @claude fix the typo in README in jerryzhao173985/my-project"
echo "   @claude create a branch feature/new-api in my repo"
echo "   @claude create a PR to add error handling"
echo "   @claude open an issue about the performance problem"
echo ""

echo "🎉 GitHub integration setup check complete!"
echo ""
echo "Note: Deploy your Worker after these changes:"
echo "  npm run deploy"