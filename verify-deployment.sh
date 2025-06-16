#!/bin/bash

# Claude Slack Bot - Deployment Verification Script
# This script verifies that all components are properly configured

echo "🔍 Claude Slack Bot - Deployment Verification"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
ALL_GOOD=true

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check Prerequisites
echo -e "${BLUE}1. Checking Prerequisites...${NC}"
echo "----------------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
    ALL_GOOD=false
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not installed${NC}"
    ALL_GOOD=false
fi

# Check wrangler
if command_exists wrangler; then
    WRANGLER_VERSION=$(wrangler --version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ Wrangler installed: $WRANGLER_VERSION${NC}"
else
    echo -e "${RED}❌ Wrangler not installed - run: npm install -g wrangler${NC}"
    ALL_GOOD=false
fi

echo ""

# 2. Check Project Structure
echo -e "${BLUE}2. Checking Project Structure...${NC}"
echo "--------------------------------"

# Check essential files
ESSENTIAL_FILES=(
    "package.json"
    "wrangler.toml"
    "tsconfig.json"
    ".github/workflows/claude-code-processor-ultimate.yml"
    "src/index.ts"
    "src/services/eventHandler.ts"
    "src/services/githubDispatcher.ts"
    "scripts/prepare-mcp-config.sh"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        ALL_GOOD=false
    fi
done

echo ""

# 3. Check Wrangler Configuration
echo -e "${BLUE}3. Checking Wrangler Configuration...${NC}"
echo "-------------------------------------"

if [ -f "wrangler.toml" ]; then
    # Check for required configurations
    if grep -q "GITHUB_WORKFLOW_FILE = \"claude-code-processor-ultimate.yml\"" wrangler.toml; then
        echo -e "${GREEN}✅ Correct workflow file configured${NC}"
    else
        echo -e "${RED}❌ Wrong workflow file in wrangler.toml${NC}"
        echo -e "${YELLOW}   Update to: claude-code-processor-ultimate.yml${NC}"
        ALL_GOOD=false
    fi
    
    if grep -q "binding = \"THREAD_CACHE\"" wrangler.toml; then
        echo -e "${GREEN}✅ KV namespace configured${NC}"
    else
        echo -e "${YELLOW}⚠️  KV namespace not configured${NC}"
        echo -e "${YELLOW}   Run: wrangler kv:namespace create THREAD_CACHE${NC}"
    fi
else
    echo -e "${RED}❌ wrangler.toml not found${NC}"
    ALL_GOOD=false
fi

echo ""

# 4. Check npm packages
echo -e "${BLUE}4. Checking npm packages...${NC}"
echo "---------------------------"

if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
    echo -e "${GREEN}✅ Dependencies locked${NC}"
else
    echo -e "${YELLOW}⚠️  No lock file found - run: npm install${NC}"
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependencies not installed - run: npm install${NC}"
    ALL_GOOD=false
fi

echo ""

# 5. Build Test
echo -e "${BLUE}5. Testing Build...${NC}"
echo "-------------------"

echo "Running TypeScript check..."
if npm run typecheck > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    echo -e "${YELLOW}   Run: npm run typecheck${NC}"
    ALL_GOOD=false
fi

echo "Building project..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${YELLOW}   Run: npm run build${NC}"
    ALL_GOOD=false
fi

echo ""

# 6. Check Required Secrets
echo -e "${BLUE}6. Required Secrets Checklist...${NC}"
echo "---------------------------------"
echo ""
echo "GitHub Repository Secrets:"
echo "  [ ] ANTHROPIC_API_KEY"
echo "  [ ] SLACK_BOT_TOKEN"
echo "  [ ] SLACK_TEAM_ID"
echo "  [ ] NOTION_KEY"
echo "  [ ] GH_TOKEN"
echo ""
echo "Cloudflare Worker Secrets:"
echo "  [ ] SLACK_SIGNING_SECRET"
echo "  [ ] SLACK_BOT_TOKEN"
echo "  [ ] GITHUB_TOKEN"
echo ""
echo -e "${YELLOW}ℹ️  Verify these are set in your GitHub repo and Cloudflare dashboard${NC}"

echo ""

# 7. Final Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Deployment Summary${NC}"
echo -e "${BLUE}============================================${NC}"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set all required secrets (see checklist above)"
    echo "2. Deploy with: npm run deploy"
    echo "3. Configure your Slack app with the Worker URL"
    echo "4. Test with: @claude hello"
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
fi

echo ""
echo "For detailed setup instructions, see: docs/quick-start.md"