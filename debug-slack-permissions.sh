#!/bin/bash

echo "🔍 Debugging Slack Bot Permissions"
echo "=================================="
echo ""
echo "This script will help you verify your Slack bot has the right permissions."
echo ""

# Check if SLACK_BOT_TOKEN is set
if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "⚠️  SLACK_BOT_TOKEN environment variable not set"
    echo "Please export it first:"
    echo "export SLACK_BOT_TOKEN='your-bot-token-here'"
    exit 1
fi

echo "1. Testing bot authentication..."
AUTH_TEST=$(curl -s https://slack.com/api/auth.test \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN")

if echo "$AUTH_TEST" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo "✅ Bot authenticated successfully"
    echo "   Team: $(echo "$AUTH_TEST" | jq -r '.team')"
    echo "   User: $(echo "$AUTH_TEST" | jq -r '.user')"
    echo "   Bot ID: $(echo "$AUTH_TEST" | jq -r '.user_id')"
else
    echo "❌ Authentication failed"
    echo "   Error: $(echo "$AUTH_TEST" | jq -r '.error')"
    exit 1
fi

echo ""
echo "2. Checking bot permissions..."
echo ""
echo "Required OAuth Scopes for message updates:"
echo "  - chat:write"
echo "  - chat:write.public (for public channels)"
echo "  - app_mentions:read (to receive mentions)"
echo ""
echo "To check your bot's scopes:"
echo "1. Go to https://api.slack.com/apps"
echo "2. Select your app"
echo "3. Go to 'OAuth & Permissions'"
echo "4. Check 'Bot Token Scopes'"
echo ""

echo "3. Testing message posting capability..."
TEST_CHANNEL="${1:-general}"
echo "   (Using channel: #$TEST_CHANNEL)"

# Test posting a message
POST_TEST=$(curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"channel\": \"$TEST_CHANNEL\",
        \"text\": \"Test message from bot debug script\"
    }")

if echo "$POST_TEST" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo "✅ Can post messages"
    MESSAGE_TS=$(echo "$POST_TEST" | jq -r '.ts')
    CHANNEL_ID=$(echo "$POST_TEST" | jq -r '.channel')
    
    echo ""
    echo "4. Testing message update capability..."
    sleep 1
    
    # Test updating the message
    UPDATE_TEST=$(curl -s -X POST https://slack.com/api/chat.update \
        -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"channel\": \"$CHANNEL_ID\",
            \"ts\": \"$MESSAGE_TS\",
            \"text\": \"Updated: This message was successfully updated!\"
        }")
    
    if echo "$UPDATE_TEST" | jq -e '.ok == true' > /dev/null 2>&1; then
        echo "✅ Can update messages!"
        echo "   Your bot has all required permissions."
    else
        echo "❌ Cannot update messages"
        echo "   Error: $(echo "$UPDATE_TEST" | jq -r '.error')"
        echo ""
        echo "   Common issues:"
        echo "   - Bot doesn't have chat:write scope"
        echo "   - Trying to update a message not posted by the bot"
        echo "   - Message is too old (Slack has time limits)"
    fi
else
    echo "❌ Cannot post messages"
    echo "   Error: $(echo "$POST_TEST" | jq -r '.error')"
    echo ""
    echo "   Common issues:"
    echo "   - Bot not in the channel"
    echo "   - Missing chat:write scope"
    echo "   - Invalid channel name"
fi

echo ""
echo "📝 Summary"
echo "=========="
echo "If all tests pass, your bot is configured correctly."
echo "If not, check the OAuth scopes in your Slack app settings."
echo ""
echo "Required scopes:"
echo "- app_mentions:read"
echo "- chat:write"
echo "- chat:write.public (for public channels)"