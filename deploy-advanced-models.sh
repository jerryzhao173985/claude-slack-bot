#!/bin/bash

echo "🚀 Deploying Advanced Model Selection"
echo "====================================="
echo ""

# Check if we're using the right workflow
echo "📋 Checking configuration..."
if grep -q "claude-code-processor-ultimate.yml" wrangler.toml; then
    echo "✅ Using Ultimate workflow (supports model parameter)"
else
    echo "⚠️  Not using Ultimate workflow - model selection may not work!"
    echo "   Update wrangler.toml to use: claude-code-processor-ultimate.yml"
fi
echo ""

# Show new features
echo "✨ New Features Being Deployed:"
echo ""
echo "1. Slash Commands:"
echo "   @claude /model advanced ..."
echo "   @claude /mode smart ..."
echo ""
echo "2. Named Presets:"
echo "   - advanced/smart/deep → Sonnet 4 (Most capable)"
echo "   - fast/balanced/quick → Sonnet 3.5 (Default)"
echo "   - latest/newest → Sonnet 3.7 (Latest)"
echo ""
echo "3. Auto-Selection:"
echo "   Words like 'comprehensive', 'detailed' → Sonnet 4"
echo ""
echo "4. Short Aliases:"
echo "   /model 4 → Sonnet 4"
echo "   /model 3.5 → Sonnet 3.5"
echo "   /model 3.7 → Sonnet 3.7"
echo ""

# Deploy
echo "🔄 Deploying to Cloudflare..."
wrangler deploy

echo ""
echo "✅ Deployment Complete!"
echo ""

echo "🧪 Test Examples:"
echo ""
echo "Basic:"
echo "  @claude /model advanced explain quantum computing"
echo "  @claude /model fast what's 2+2?"
echo ""
echo "Presets:"
echo "  @claude advanced mode analyze our sales data"
echo "  @claude fast mode quick summary please"
echo ""
echo "Auto-selection:"
echo "  @claude write a comprehensive technical guide"
echo "  @claude create a detailed analysis report"
echo ""
echo "Short form:"
echo "  @claude /model 4 solve this complex problem"
echo "  @claude /mode smart debug this code"
echo ""

echo "📊 Monitor with: wrangler tail"
echo ""
echo "🎯 The bot will show which model is being used:"
echo "   '🤔 Working on your request (using Sonnet 4)...'"