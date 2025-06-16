# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. Bot Not Responding

**Symptoms:**
- @claude mentions are ignored
- No "Working..." message appears

**Solutions:**

#### Check Bot Permissions
Run this test to verify your bot token has the correct scopes:
```bash
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"
```

If it fails with "missing_scope", your bot needs the `chat:write` permission:
1. Go to https://api.slack.com/apps
2. Select your app
3. OAuth & Permissions → Scopes
4. Add `chat:write` and `app_mentions:read`
5. Reinstall the app to workspace

#### Verify Bot is in Channel
- Use `/invite @claude` to add bot to channel
- Check that event subscriptions are enabled in Slack app settings

### 2. "Working..." Message Never Updates

**Symptoms:**
- Bot posts "Working..." but never updates it
- GitHub Action may be failing

**Solutions:**

#### Check GitHub Secrets
Ensure these are set in your GitHub repository:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `SLACK_BOT_TOKEN` - Your bot token (xoxb-...)
- `SLACK_TEAM_ID` - Your team ID (T...)
- `NOTION_KEY` - Notion integration token (optional)
- `GH_TOKEN` - GitHub PAT with repo scope

#### Check Cloudflare Logs
```bash
wrangler tail
```

Look for:
- "Successfully dispatched workflow" ✅
- Any error messages about signature verification or missing secrets

#### Check GitHub Actions
1. Go to your repo on GitHub
2. Click "Actions" tab
3. Look for failed runs
4. Click to see detailed logs

### 3. Common Error Messages

#### "channel_not_found"
**Cause:** Using channel name instead of ID
**Fix:** Use channel ID (C1234...) not channel name (#general)

#### "not_authed"
**Cause:** Invalid or missing bot token
**Fix:** 
- Verify SLACK_BOT_TOKEN is set correctly
- Token should start with xoxb-
- Regenerate token if needed

#### "missing_scope"
**Cause:** Bot lacks required permissions
**Fix:** Add missing scopes in Slack app settings (see section 1)

#### "invalid_auth"
**Cause:** Token is expired or revoked
**Fix:** Get new token from Slack app settings

#### Claude API Errors
**Cause:** Invalid API key or no credits
**Fix:**
- Check ANTHROPIC_API_KEY is correct
- Verify you have API credits available
- Test API directly:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

### 4. Notion Integration Issues

#### Pages Not Being Created
1. **Check Integration Token**:
   - Verify `NOTION_KEY` is set in GitHub Secrets
   - Ensure token starts with `secret_`

2. **Check Parent Page**:
   - Ensure "Claude Code" page exists in Notion
   - Verify it's shared with the integration
   - Check the "Add connections" menu shows your integration

3. **Internal Integration Limitations**:
   - Internal integrations cannot create top-level workspace pages
   - Must have a parent page shared with the integration

### 5. Workflow Selection Issues

If the bot is using the wrong workflow or not updating messages:

```bash
# Check current workflow
wrangler secret list

# Update to recommended workflow
wrangler secret put GITHUB_WORKFLOW_FILE
# Enter: claude-code-processor.yml
```

### 6. Debug Mode

Add debug logging to your workflow to troubleshoot issues:

```yaml
- name: Debug Info
  run: |
    echo "Channel: ${{ github.event.inputs.slack_channel }}"
    echo "TS: ${{ github.event.inputs.slack_ts }}"
    echo "Question: ${{ github.event.inputs.question }}"
    echo "Bot token starts with: ${SLACK_BOT_TOKEN:0:10}"
    echo "API key starts with: ${ANTHROPIC_API_KEY:0:10}"
```

### 7. Manual Testing

#### Test Slack API
```bash
# Test auth
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"

# Test posting a message
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C1234567890",
    "text": "Test message from bot"
  }'
```

#### Test Claude API
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 8. Clean Slate Approach

If nothing else works, try starting fresh:

```bash
# 1. Use the simplest workflow
wrangler secret delete GITHUB_WORKFLOW_FILE
wrangler secret put GITHUB_WORKFLOW_FILE
# Enter: claude-code-processor.yml

# 2. Verify all secrets
wrangler secret list

# 3. Redeploy
npm run deploy

# 4. Test with simple question
# @claude hello
```

### 9. Performance Issues

#### Slow Responses
- Check GitHub Actions runtime
- Consider using faster models for simple queries
- Monitor API rate limits

#### Worker Timeout
- Cloudflare Workers have a 10ms CPU limit
- Complex operations should be deferred to GitHub Actions

### 10. Notion Pages Created Without Content

**Issue**: Pages appear in Notion with only titles, no question/answer/metadata content.

**Cause**: The workflow was creating pages and attempting to add content separately, but the second operation wasn't executing properly.

**Solution**: 
1. **Updated workflow** to include all content in the `children` array during page creation
2. **Single API call** instead of create-then-update approach
3. **Explicit block structure** with proper `object` and `type` fields

**Test the fix**:
```bash
# Run the test workflow
Actions → Test Notion Content Creation → Run workflow

# Or test in Slack
@claude test notion integration
```

**Verify content blocks**:
- Each block must have `object: "block"` and correct `type`
- Rich text must be properly formatted
- All content included in initial `API-post-page` call

### 11. Getting Help

If you're still experiencing issues:

1. **Check logs carefully** - The error is usually visible in:
   - Cloudflare Worker logs: `wrangler tail`
   - GitHub Actions logs: Actions tab in repo
   - Slack app activity logs

2. **Common root causes**:
   - Wrong token/key (90% of issues)
   - Missing permissions
   - Using channel name instead of ID
   - Workflow file mismatch

3. **Test incrementally**:
   - Start with the simplest workflow
   - Test each component separately
   - Add features one at a time