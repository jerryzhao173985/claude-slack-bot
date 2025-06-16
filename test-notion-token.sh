#!/bin/bash

# Test script to verify Notion token format and connection
# Usage: NOTION_KEY=your_token bash test-notion-token.sh

if [ -z "$NOTION_KEY" ]; then
    echo "❌ NOTION_KEY environment variable is not set"
    echo "Usage: NOTION_KEY=your_token bash test-notion-token.sh"
    exit 1
fi

# Check token format
if [[ $NOTION_KEY == secret_* ]]; then
    echo "✅ Token format looks correct (starts with 'secret_')"
else
    echo "⚠️  Warning: Notion integration tokens usually start with 'secret_'"
fi

# Test the token with a simple API call
echo ""
echo "Testing Notion API connection..."
RESPONSE=$(curl -s -X GET https://api.notion.com/v1/users/me \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2022-06-28")

if echo "$RESPONSE" | grep -q '"object":"user"'; then
    echo "✅ Successfully connected to Notion API"
    echo "User info: $(echo "$RESPONSE" | jq -r '.name // "No name"')"
else
    echo "❌ Failed to connect to Notion API"
    echo "Response: $RESPONSE"
fi

# Test search endpoint
echo ""
echo "Testing search endpoint..."
SEARCH_RESPONSE=$(curl -s -X POST https://api.notion.com/v1/search \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"query":"Claude Code","filter":{"value":"page","property":"object"}}')

if echo "$SEARCH_RESPONSE" | grep -q '"object":"list"'; then
    echo "✅ Search endpoint working"
    RESULTS_COUNT=$(echo "$SEARCH_RESPONSE" | jq '.results | length')
    echo "Found $RESULTS_COUNT pages matching 'Claude Code'"
else
    echo "❌ Search endpoint failed"
    echo "Response: $SEARCH_RESPONSE"
fi