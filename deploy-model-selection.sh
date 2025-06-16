#!/bin/bash

echo "🚀 Deploying Model Selection Feature"
echo "===================================="
echo ""

# Check current configuration
echo "📋 Current Configuration:"
grep "GITHUB_WORKFLOW_FILE" wrangler.toml
echo ""

# Show what's new
echo "✨ New Features:"
echo "  - Specify model in Slack messages"
echo "  - Support for 3 Claude models"
echo "  - User-friendly aliases"
echo "  - Model shown in placeholder message"
echo ""

echo "📦 Available Models:"
echo "  - claude-3-7-sonnet-20250219 (alias: sonnet-3.7)"
echo "  - claude-3-5-sonnet-20241022 (alias: sonnet-3.5) [default]"
echo "  - claude-sonnet-4-20250514 (alias: sonnet-4, opus-4)"
echo ""

# Deploy
echo "🔄 Deploying to Cloudflare..."
wrangler deploy

echo ""
echo "✅ Deployment Complete!"
echo ""

echo "🧪 Test Examples:"
echo "  @claude using sonnet-3.7 what is 2+2?"
echo "  @claude with opus-4 explain quantum computing"
echo "  @claude model: sonnet-3.5 write a haiku"
echo ""

echo "📊 Monitor:"
echo "  - Cloudflare logs: wrangler tail"
echo "  - GitHub Actions: Check model input parameter"
echo ""

echo "🎉 Your bot now supports model selection!"