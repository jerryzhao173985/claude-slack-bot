#!/bin/bash

# Test script for Claude Slack Bot

echo "🧪 Claude Slack Bot Test Script"
echo "==============================="
echo ""

# Check if bot token is set
if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "⚠️  SLACK_BOT_TOKEN not found in environment"
    echo "   This is okay if it's set in Cloudflare secrets"
    echo ""
fi

# Test local build
echo "📦 Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check current workflow
echo ""
echo "🔍 Checking current configuration..."
echo "   To see current workflow, check your Cloudflare dashboard"
echo "   Or run: wrangler secret list"

# Provide test message
echo ""
echo "📝 Test Messages to Try:"
echo ""
echo "1. Simple test:"
echo "   @claude what is 2+2?"
echo ""
echo "2. With context:"
echo "   @claude can you help me understand this error message?"
echo ""
echo "3. With MCP tools:"
echo "   @claude check my recent github commits"
echo "   @claude search notion for project roadmap"
echo ""
echo "🎯 Expected Behavior:"
echo "1. Bot responds immediately with '🤔 Working on your request...'"
echo "2. Within 30-60 seconds, that message updates with Claude's response"
echo "3. No extra messages or thread replies (with recommended workflow)"
echo ""
echo "📊 Monitoring:"
echo "- Worker logs: wrangler tail"
echo "- GitHub Actions: Check Actions tab in your repo"
echo "- Slack: Check bot's message history"
echo ""
echo "✨ Your bot is ready to test!"