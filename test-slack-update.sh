#!/bin/bash

# Test script to verify Slack message update capability

echo "🧪 Testing Slack Message Update Capability"
echo "========================================"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-slack-update.sh YOUR_SLACK_BOT_TOKEN"
    echo ""
    echo "Example:"
    echo "./test-slack-update.sh xoxb-1234567890-..."
    exit 1
fi

SLACK_BOT_TOKEN="$1"
CHANNEL="${2:-general}"  # Default to general if not provided

echo "Using channel: $CHANNEL"
echo ""

# Step 1: Post a test message
echo "1️⃣ Posting test message..."
POST_RESPONSE=$(curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"channel\": \"$CHANNEL\",
        \"text\": \"Test message - will be updated in 3 seconds...\"
    }")

# Check if post was successful
if echo "$POST_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo "✅ Posted message successfully"
    MESSAGE_TS=$(echo "$POST_RESPONSE" | jq -r '.ts')
    CHANNEL_ID=$(echo "$POST_RESPONSE" | jq -r '.channel')
    echo "   Message timestamp: $MESSAGE_TS"
    echo "   Channel ID: $CHANNEL_ID"
else
    echo "❌ Failed to post message"
    echo "Error: $(echo "$POST_RESPONSE" | jq -r '.error // "unknown"')"
    echo "Full response:"
    echo "$POST_RESPONSE" | jq '.'
    exit 1
fi

# Wait 3 seconds
echo ""
echo "⏳ Waiting 3 seconds..."
sleep 3

# Step 2: Update the message
echo ""
echo "2️⃣ Updating the message..."
UPDATE_RESPONSE=$(curl -s -X POST https://slack.com/api/chat.update \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"channel\": \"$CHANNEL_ID\",
        \"ts\": \"$MESSAGE_TS\",
        \"text\": \"✅ Message successfully updated! Your bot can update messages.\"
    }")

# Check if update was successful
if echo "$UPDATE_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo "✅ Updated message successfully!"
    echo ""
    echo "🎉 SUCCESS: Your bot token has the necessary permissions!"
    echo ""
    echo "Channel ID to use in your bot: $CHANNEL_ID"
else
    echo "❌ Failed to update message"
    echo "Error: $(echo "$UPDATE_RESPONSE" | jq -r '.error // "unknown"')"
    echo ""
    echo "Common issues:"
    echo "- 'channel_not_found': Use the channel ID ($CHANNEL_ID) instead of name"
    echo "- 'not_authed': Invalid bot token"
    echo "- 'missing_scope': Bot needs 'chat:write' scope"
    echo ""
    echo "Full response:"
    echo "$UPDATE_RESPONSE" | jq '.'
fi