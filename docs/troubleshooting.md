# 🔧 Comprehensive Troubleshooting Guide - Claude Slack Bot

This guide provides solutions for all common issues and advanced debugging techniques.

## Table of Contents
1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [GitHub Workflow Issues](#github-workflow-issues)
4. [Slack Integration Issues](#slack-integration-issues)
5. [Notion Integration Issues](#notion-integration-issues)
6. [Advanced Debugging](#advanced-debugging)
7. [Error Message Reference](#error-message-reference)
8. [Prevention Strategies](#prevention-strategies)
9. [Emergency Recovery](#emergency-recovery)

---

## Quick Diagnostics

Before diving into specific issues, run through this diagnostic checklist:

```bash
# 1. Check Worker deployment status
wrangler deployments list

# 2. Verify all secrets are set
wrangler secret list
# Should show: SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, GITHUB_TOKEN

# 3. Monitor real-time logs
wrangler tail

# 4. Test workflow dispatch
curl https://your-worker.workers.dev/debug/test-dispatch

# 5. Check GitHub Actions
# Visit: https://github.com/YOUR_USERNAME/claude-slack-bot/actions

# 6. Test Slack signature verification
curl -X POST https://your-worker.workers.dev/slack/events \
  -H "Content-Type: application/json" \
  -d '{"challenge":"test_challenge"}'
```

---

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

---

## GitHub Workflow Issues

### Missing mcp_tools Parameter (Critical!)

**This is the #1 cause of workflow failures!**

**Symptoms:**
- Worker shows successful dispatch but no GitHub Action runs
- GitHub API returns 422 error: "Unexpected inputs"
- Workflow was working before but stopped after cleanup

**Root Cause:**
The `mcp_tools` input parameter was accidentally removed during refactoring.

**Fix:**
Ensure your workflow has ALL required inputs:
```yaml
on:
  workflow_dispatch:
    inputs:
      question:
        description: "The user's question"
        required: true
        type: string
      slack_channel:
        description: "Slack channel ID"
        required: true
        type: string
      slack_ts:
        description: "Slack message timestamp"
        required: true
        type: string
      slack_thread_ts:
        description: "Thread timestamp"
        required: false
        type: string
      system_prompt:
        description: "System prompt"
        required: false
        type: string
      model:
        description: "Model to use"
        required: false
        type: string
        default: "claude-3-5-sonnet-20241022"
      mcp_tools:  # CRITICAL - This was missing!
        description: "Comma-separated list of MCP tools"
        required: false
        type: string
```

### Workflow Dispatch Authentication

**Issue**: 401 or 403 errors when dispatching workflow

**Check GitHub Token:**
```bash
# In Cloudflare Worker
wrangler secret list
# Should show GITHUB_TOKEN

# Test token permissions
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/claude-slack-bot
```

**Required Scopes:**
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows

---

## Slack Integration Issues

### Thread Context Not Working

**Symptoms:**
- Bot can't see previous messages in thread
- "Summarize this thread" returns empty
- Thread history not being fetched

**Solutions:**

1. **Check KV Namespace Binding:**
   ```toml
   # In wrangler.toml
   [[kv_namespaces]]
   binding = "THREAD_CACHE"
   id = "your-kv-namespace-id"
   ```

2. **Verify Slack Permissions:**
   - `channels:history` - Read public channel messages
   - `groups:history` - Read private channel messages
   - `im:history` - Read DM messages

3. **Debug Thread Fetching:**
   ```typescript
   // Add to slackClient.ts
   console.log('Fetching thread:', { channel, thread_ts });
   console.log('Messages found:', messages.length);
   ```

### Message Update Failures

**Issue**: Bot doesn't update the "Working..." message

**Common Causes:**
1. Wrong timestamp being used (thread_ts vs message ts)
2. Missing `chat:write` permission
3. Token not passed to GitHub Action

**Debug:**
```bash
# Test updating a message directly
curl -X POST https://slack.com/api/chat.update \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C1234567890",
    "ts": "1234567890.123456",
    "text": "Updated message"
  }'
```

---

## Notion Integration Issues

### Internal Integration Limitations

**Issue**: Cannot create top-level workspace pages

**Solution**: 
- Always use a parent page (like "Claude Code")
- Share parent page with integration
- Use page_id, not database_id

### Permission Errors

**Symptoms:**
- "Insufficient permissions" errors
- Pages not being created
- Integration not visible in Notion

**Fix:**
1. Verify integration has all capabilities:
   - Read content ✅
   - Update content ✅
   - Insert content ✅

2. Share parent page:
   - Open "Claude Code" page
   - Click "..." → "Add connections"
   - Select your integration

3. Test with simple creation:
   ```bash
   curl -X POST https://api.notion.com/v1/pages \
     -H "Authorization: Bearer $NOTION_KEY" \
     -H "Notion-Version: 2022-06-28" \
     -H "Content-Type: application/json" \
     -d '{
       "parent": {"page_id": "YOUR_PAGE_ID"},
       "properties": {
         "title": {"title": [{"text": {"content": "Test"}}]}
       }
     }'
   ```

---

## Error Message Reference

| Error | Meaning | Fix |
|-------|---------|-----|
| `422 Unexpected inputs` | Workflow missing input definition | Add missing input (often `mcp_tools`) to workflow |
| `404 Workflow not found` | Wrong filename or not pushed | Check exact filename, push changes, redeploy Worker |
| `401 Bad credentials` | Invalid GitHub token | Regenerate token with correct scopes |
| `403 Resource not accessible` | Token lacks permissions | Add `repo` and `workflow` scopes |
| `channel_not_found` | Using channel name instead of ID | Use channel ID (C1234...) not name (#general) |
| `not_authed` | Invalid or missing bot token | Verify SLACK_BOT_TOKEN is set correctly |
| `missing_scope` | Bot lacks required permissions | Add missing scopes in Slack app settings |
| `invalid_auth` | Token is expired or revoked | Get new token from Slack app settings |
| `Rate limit exceeded` | Too many API requests | Wait or implement rate limiting |

---

## Prevention Strategies

### Configuration Management

**1. Create Verification Script:**
```bash
cat > verify-config.sh << 'EOF'
#!/bin/bash
echo "=== Configuration Check ==="
echo "1. Workflow file:"
grep GITHUB_WORKFLOW_FILE wrangler.toml
echo ""
echo "2. Workflow exists:"
ls -la .github/workflows/
echo ""
echo "3. Worker secrets:"
wrangler secret list
echo ""
echo "4. Required workflow inputs:"
grep -A20 "inputs:" .github/workflows/claude-code-processor.yml | grep "description:"
EOF
chmod +x verify-config.sh
```

**2. Pre-deployment Checklist:**
- [ ] All secrets set in Worker (SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, GITHUB_TOKEN)
- [ ] All secrets set in GitHub (ANTHROPIC_API_KEY, SLACK_BOT_TOKEN, SLACK_TEAM_ID, NOTION_KEY, GH_TOKEN)
- [ ] Workflow file name matches wrangler.toml exactly
- [ ] Workflow has all required inputs (especially `mcp_tools`)
- [ ] Worker redeployed after configuration changes
- [ ] Test dispatch endpoint working

**3. Deployment Best Practices:**
```bash
# Always deploy and monitor
npm run deploy && wrangler tail

# Test immediately after deployment
curl https://your-worker.workers.dev/debug/config
curl https://your-worker.workers.dev/debug/test-dispatch
```

### Monitoring Setup

**Create Health Check Script:**
```bash
cat > monitor-bot.sh << 'EOF'
#!/bin/bash
WORKER_URL="https://your-worker.workers.dev"
SLACK_WEBHOOK="your-monitoring-webhook"

# Check health endpoint
HEALTH=$(curl -s $WORKER_URL/health)
if [[ $HEALTH != *"ok"* ]]; then
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Bot health check failed!"}'
fi

# Check config
CONFIG=$(curl -s $WORKER_URL/debug/config)
if [[ $CONFIG != *"true"* ]]; then
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Bot configuration issue detected!"}'
fi
EOF
```

---

## Emergency Recovery

### Complete System Reset

If nothing else works, perform a full reset:

**1. Reset Cloudflare Worker:**
```bash
# Delete and recreate
wrangler delete
wrangler kv:namespace create "THREAD_CACHE"
# Update wrangler.toml with new KV ID
npm run deploy
```

**2. Reset GitHub Configuration:**
```bash
# Restore known working workflow
git checkout origin/main -- .github/workflows/claude-code-processor.yml
git add .github/workflows/claude-code-processor.yml
git commit -m "Restore working workflow configuration"
git push
```

**3. Reset All Secrets:**
```bash
# Worker secrets
wrangler secret delete SLACK_SIGNING_SECRET
wrangler secret delete SLACK_BOT_TOKEN
wrangler secret delete GITHUB_TOKEN

# Re-add them
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GITHUB_TOKEN
```

**4. Minimal Test Configuration:**
Start with the absolute minimum:
- Disable Notion integration
- Remove all MCP servers except Slack
- Use default model only
- Test basic @claude hello

### Rollback Procedures

**Quick Rollback to Last Working Version:**
```bash
# 1. Find last working deployment
wrangler deployments list

# 2. Rollback Worker
wrangler rollback [deployment-id]

# 3. Rollback workflow if needed
git log --oneline -- .github/workflows/
git checkout [commit-hash] -- .github/workflows/claude-code-processor.yml
git commit -m "Rollback to working workflow"
git push
```

### Debug Mode Deployment

For deep debugging, deploy with verbose logging:

```typescript
// Add to src/index.ts
app.use('*', async (c, next) => {
  console.log('Request:', {
    method: c.req.method,
    url: c.req.url,
    headers: Object.fromEntries(c.req.headers),
  });
  await next();
  console.log('Response:', {
    status: c.res.status,
    headers: Object.fromEntries(c.res.headers),
  });
});
```

---

## Critical Reminders

⚠️ **The #1 Rule**: After ANY configuration change, run `npm run deploy`

⚠️ **The #1 Bug**: Missing `mcp_tools` parameter in workflow - always verify!

⚠️ **The #1 Fix**: When in doubt, redeploy the Worker

⚠️ **Configuration Sync**: Worker and GitHub must have matching configuration

---

## Support Resources

- **Real-time Logs**: `wrangler tail`
- **GitHub Actions**: Check Actions tab for detailed logs
- **Debug Endpoints**: `/debug/config` and `/debug/test-dispatch`
- **Test Scripts**: Use provided bash scripts for testing
- **Issues**: [GitHub Issues](https://github.com/jerryzhao173985/claude-slack-bot/issues)

---

*Remember: 90% of issues are configuration-related. Check tokens, permissions, and deployment status first!*