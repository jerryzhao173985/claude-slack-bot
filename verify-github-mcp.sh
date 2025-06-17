#!/bin/bash

# Verification script for GitHub MCP Server setup

echo "🔍 Verifying GitHub MCP Server Configuration"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    echo -e "${GREEN}✅ Running in GitHub Actions${NC}"
else
    echo -e "${YELLOW}⚠️  Not running in GitHub Actions - some checks may differ${NC}"
fi
echo ""

# Check environment variables
echo "1. Checking Environment Variables:"
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
    echo -e "${GREEN}✅ GitHub token is set${NC}"
else
    echo -e "${RED}❌ Neither GITHUB_PERSONAL_ACCESS_TOKEN nor GH_TOKEN is set${NC}"
fi

# Test downloading the binary
echo ""
echo "2. Testing Binary Download:"
if command -v curl &> /dev/null; then
    echo "Testing download of github-mcp-server binary..."
    if curl -fsSL https://github.com/github/github-mcp-server/releases/download/v0.5.0/github-mcp-server_Linux_x86_64.tar.gz -o /tmp/test-download.tar.gz; then
        echo -e "${GREEN}✅ Binary download successful${NC}"
        rm -f /tmp/test-download.tar.gz
    else
        echo -e "${RED}❌ Binary download failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available${NC}"
fi

# Check if binary exists (if already installed)
echo ""
echo "3. Checking Binary Installation:"
if command -v github-mcp-server &> /dev/null; then
    echo -e "${GREEN}✅ github-mcp-server is in PATH${NC}"
    echo "   Location: $(which github-mcp-server)"
    echo "   Testing binary..."
    if github-mcp-server --help &> /dev/null; then
        echo -e "${GREEN}✅ Binary is executable${NC}"
    else
        echo -e "${RED}❌ Binary exists but not executable${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  github-mcp-server not found in PATH${NC}"
fi

# Check workflow configuration
echo ""
echo "4. Checking Workflow Configuration:"
if [ -f ".github/workflows/claude-code-processor.yml" ]; then
    if grep -q '"command": "github-mcp-server"' .github/workflows/claude-code-processor.yml; then
        echo -e "${GREEN}✅ Workflow configured to use github-mcp-server binary${NC}"
    else
        echo -e "${RED}❌ Workflow not using github-mcp-server binary${NC}"
    fi
    
    if grep -q "Install GitHub MCP Server" .github/workflows/claude-code-processor.yml; then
        echo -e "${GREEN}✅ Binary installation step found in workflow${NC}"
    else
        echo -e "${RED}❌ Binary installation step missing${NC}"
    fi
fi

echo ""
echo "📋 Summary:"
echo "- GitHub MCP server is distributed as a binary, not an npm package"
echo "- The workflow downloads and installs the Linux x86_64 binary"
echo "- The MCP config uses 'github-mcp-server' command directly"
echo "- Make sure GH_TOKEN secret is set in repository settings"

# Test command that would be used
echo ""
echo "🧪 Test Command (what Claude will run):"
echo 'GITHUB_PERSONAL_ACCESS_TOKEN=$GH_TOKEN github-mcp-server stdio --toolsets all'
echo ""
echo "Note: The 'stdio' argument is REQUIRED for MCP communication"