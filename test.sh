#!/bin/bash

echo "🧪 Claude Slack Bot Test Suite"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check workflow configuration
echo "1. Checking workflow configuration..."
if grep -q "claude-code-processor-ultimate.yml" wrangler.toml; then
    echo -e "${GREEN}✅ Correct workflow configured${NC}"
else
    echo -e "${RED}❌ Wrong workflow in wrangler.toml${NC}"
    exit 1
fi

# Test 2: Check required files exist
echo ""
echo "2. Checking required files..."
required_files=(
    ".github/workflows/claude-code-processor-ultimate.yml"
    ".github/workflows/claude-code-direct-api.yml"
    "src/services/eventHandler.ts"
    "wrangler.toml"
    "package.json"
)

all_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_exist=false
    fi
done

if [ "$all_exist" = false ]; then
    exit 1
fi

# Test 3: Check Notion configuration
echo ""
echo "3. Checking Notion integration..."
if grep -q "notionApi" scripts/prepare-mcp-config.sh; then
    echo -e "${GREEN}✅ Notion MCP server configured${NC}"
else
    echo -e "${RED}❌ Notion MCP server missing${NC}"
fi

if grep -q "mcp__notionApi__API-post-search" .github/workflows/claude-code-processor-ultimate.yml; then
    echo -e "${GREEN}✅ Notion tools in allowed_tools${NC}"
else
    echo -e "${YELLOW}⚠️  Notion tools not in allowed_tools${NC}"
fi

# Test 4: Check model selection patterns
echo ""
echo "4. Model selection test patterns..."
echo -e "${YELLOW}Test these in Slack after deployment:${NC}"
echo ""
echo "Basic (will save to Notion):"
echo "  @claude hello"
echo ""
echo "Model Selection:"
echo "  @claude /model advanced explain AI"
echo "  @claude fast mode what's 2+2?"
echo "  @claude using sonnet-4 write code"
echo ""
echo "Auto-selection:"
echo "  @claude write a comprehensive analysis"
echo ""
echo "Notion Integration:"
echo "  Check Notion for 'Claude Code' folder after each question"
echo ""

# Test 5: Check npm scripts
echo "5. Checking npm scripts..."
if npm run --silent typecheck > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript errors (run 'npm run typecheck' for details)${NC}"
fi

# Summary
echo ""
echo "=============================="
echo "Ready to deploy? Run:"
echo -e "${GREEN}./deploy.sh${NC}"
echo ""
echo "Then monitor with:"
echo -e "${GREEN}wrangler tail${NC}"