# 🔧 Troubleshooting Guide

## Still Not Working?

### 1. Check Your Slack Bot Token

Run this test:
```bash
./test-slack-update.sh xoxb-YOUR-TOKEN-HERE
```

If it fails with "missing_scope", your bot needs the `chat:write` permission:
1. Go to https://api.slack.com/apps
2. Select your app
3. OAuth & Permissions → Scopes
4. Add `chat:write`
5. Reinstall the app

### 2. Check GitHub Secrets

Make sure these are set in your GitHub repo:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `SLACK_BOT_TOKEN` - Your bot token (xoxb-...)
- `SLACK_TEAM_ID` - Your team ID (T...)

### 3. Check Cloudflare Logs

```bash
wrangler tail
```

Look for:
- "Successfully dispatched workflow" ✅
- Any error messages ❌

### 4. Check GitHub Actions

1. Go to your repo on GitHub
2. Click "Actions" tab
3. Look for failed runs
4. Click to see logs

### 5. Common Errors & Fixes

#### "channel_not_found"
- Use channel ID (C1234...) not channel name (#general)
- Bot must be in the channel

#### "not_authed"  
- SLACK_BOT_TOKEN is wrong or not set
- Token doesn't start with xoxb-

#### "missing_scope"
- Bot needs chat:write permission
- See step 1 above

#### "invalid_auth"
- Token is expired or revoked
- Get new token from Slack app settings

#### Claude API errors
- Check ANTHROPIC_API_KEY is correct
- Check you have API credits

### 6. Nuclear Option - Start Fresh

If nothing works:
```bash
# 1. Use the simplest possible workflow
wrangler secret delete GITHUB_WORKFLOW_FILE
wrangler secret put GITHUB_WORKFLOW_FILE
# Enter: claude-code-direct-api.yml

# 2. Push fresh code
git add .
git commit -m "Fresh start with direct API"
git push

# 3. Test with simple question
# @claude hi
```

### 7. Debug Mode

Add debug logging to the workflow:
```yaml
- name: Debug Info
  run: |
    echo "Channel: ${{ github.event.inputs.slack_channel }}"
    echo "TS: ${{ github.event.inputs.slack_ts }}"
    echo "Question: ${{ github.event.inputs.question }}"
    echo "Bot token starts with: ${SLACK_BOT_TOKEN:0:10}"
    echo "API key starts with: ${ANTHROPIC_API_KEY:0:10}"
```

### 8. Manual Test

Test the APIs directly:
```bash
# Test Claude API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'

# Test Slack API  
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"
```

### 9. Get Help

If still stuck:
1. Check the logs carefully
2. The issue is usually:
   - Wrong token/key
   - Missing permissions
   - Channel ID vs name
3. Try the simplest workflow first