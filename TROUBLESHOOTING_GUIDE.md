# 🔧 Claude Slack Bot - Comprehensive Troubleshooting Guide

## Quick Diagnostics Checklist

Before diving into specific issues, run through this checklist:

```bash
# 1. Check Worker deployment
wrangler deployments list

# 2. Verify secrets are set
wrangler secret list

# 3. Monitor real-time logs
wrangler tail

# 4. Test workflow dispatch
curl https://your-worker.workers.dev/debug/test-dispatch

# 5. Check GitHub Actions
# Visit: https://github.com/YOUR_USERNAME/claude-slack-bot/actions
```

---

## Common Issues & Solutions

### 🚫 Issue: GitHub Workflow Not Triggering

**Symptoms:**
- Bot responds with "🤔 Working..." but nothing happens
- No new runs in GitHub Actions tab
- Worker logs show dispatch attempt

**Solution 1: Check Workflow Input Parameters**
```bash
# The #1 cause: Missing mcp_tools parameter!
# Ensure your workflow has ALL these inputs:
cat .github/workflows/claude-code-processor.yml | grep -A20 "inputs:"
```

Required inputs:
```yaml
inputs:
  question:
  slack_channel:
  slack_ts:
  slack_thread_ts:
  system_prompt:
  model:
  mcp_tools:  # THIS IS OFTEN MISSING!
```

**Solution 2: Verify GitHub Token**
```bash
# Check if GITHUB_TOKEN is set in Worker
wrangler secret list
# Should show: GITHUB_TOKEN

# Test token permissions
export GITHUB_TOKEN="your-pat-token"
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

**Solution 3: Redeploy After Config Changes**
```bash
# CRITICAL: Always redeploy after changing workflow names!
npm run deploy
```

---

### 📝 Issue: Notion Pages Created Without Content

**Symptoms:**
- Notion page appears but only shows title
- No question/answer content visible
- Logs show "API-post-page" success

**Root Cause:** Attempting to use separate API calls for content

**Solution:** Include ALL content in initial page creation:
```json
{
  "parent": { "page_id": "PARENT_ID" },
  "properties": { "title": { "title": [{ "text": { "content": "Title" } }] } },
  "children": [
    // ALL content blocks must go here!
    { "heading_1": { "rich_text": [{ "text": { "content": "Title" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "Content" } }] } }
  ]
}
```

**Do NOT use:** `API-patch-block-children` after creation

---

### 🔐 Issue: MCP Permission Errors

**Symptoms:**
- "Claude requested permissions to use mcp__notionApi__API-post-page"
- Workflow hangs waiting for permission approval
- Non-interactive environment can't approve

**Solution:** Add environment variable to workflow:
```yaml
claude_env: |
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

---

### 🤖 Issue: Wrong Model Being Used

**Symptoms:**
- Request for "model 4" uses Sonnet 3.5
- Model selection commands ignored
- Default model always used

**Debug Steps:**
1. Check model detection in Worker logs
2. Verify exact command format:
   ```slack
   @claude /model advanced analyze
   @claude using sonnet-4 respond
   @claude with model 3.7 summarize
   ```

**Common Mistakes:**
- Wrong aliases (use "advanced" not "adv")
- Missing slash for commands
- Typos in model names

---

### 🔄 Issue: Workflow File Not Found (404)

**Symptoms:**
- Worker logs show "404 - Workflow not found"
- GitHub API returns 404 error
- Dispatch appears to work but no action runs

**Solutions:**

1. **Check Workflow Name Match:**
   ```bash
   # In wrangler.toml
   grep GITHUB_WORKFLOW_FILE wrangler.toml
   # Should match EXACTLY (case-sensitive!)
   
   # In .github/workflows/
   ls -la .github/workflows/
   ```

2. **Common Naming Issues:**
   - `claude-code-processor.yml` ≠ `claude-code-processor.yaml`
   - `processor.yml` ≠ `Processor.yml`
   - Spaces in filenames cause issues

3. **After Renaming:**
   ```bash
   # MUST redeploy Worker!
   npm run deploy
   ```

---

### 💬 Issue: Slack Updates Not Working

**Symptoms:**
- Bot doesn't update placeholder message
- Thread replies missing
- Wrong timestamp used

**Debug Process:**
1. Check Slack tokens:
   ```bash
   # Both Worker and GitHub need SLACK_BOT_TOKEN
   wrangler secret list
   ```

2. Verify OAuth scopes:
   - `chat:write`
   - `chat:write.public`
   - `users:read`

3. Check timestamps in logs:
   - placeholder_ts vs thread_ts
   - Ensure correct ts is used for updates

---

### 🧵 Issue: Thread Context Not Working

**Symptoms:**
- "summarize this thread" shows no context
- Bot can't see previous messages
- Thread history empty

**Solutions:**

1. **Check KV Namespace:**
   ```bash
   # Verify THREAD_CACHE is bound
   grep THREAD_CACHE wrangler.toml
   ```

2. **Check Slack Permissions:**
   - Need `channels:history`
   - Need `groups:history` for private channels

3. **Debug Cache:**
   ```typescript
   // Add logging to see cache hits/misses
   console.log('Cache key:', cacheKey);
   console.log('Cached:', !!cached);
   ```

---

## Advanced Debugging

### Enable Verbose Logging

**In Worker (eventHandler.ts):**
```typescript
console.log('Dispatch payload:', JSON.stringify({
  url,
  inputs,
  headers: Object.fromEntries(response.headers)
}));
```

**In Workflow:**
```yaml
- name: Debug Environment
  run: |
    echo "All inputs:"
    echo "${{ toJSON(github.event.inputs) }}"
```

### Test Specific Components

**1. Test Slack Signature Verification:**
```bash
curl -X POST https://your-worker.workers.dev/slack/events \
  -H "Content-Type: application/json" \
  -d '{"challenge":"test_challenge"}'
```

**2. Test GitHub Dispatch Directly:**
```bash
# Use troubleshoot-dispatch.sh
./troubleshoot-dispatch.sh
```

**3. Test MCP Servers:**
```yaml
# Add test workflow that only runs MCP commands
- name: Test MCP
  run: |
    npx @modelcontextprotocol/server-slack list-channels
```

---

## Error Messages Decoder

| Error | Meaning | Fix |
|-------|---------|-----|
| `422 Unexpected inputs` | Workflow missing input definition | Add missing input to workflow |
| `404 Workflow not found` | Wrong filename or not pushed | Check exact filename, push changes |
| `401 Bad credentials` | Invalid GitHub token | Regenerate token with correct scopes |
| `403 Resource not accessible` | Token lacks permissions | Add `repo` and `workflow` scopes |
| `Missing charset` | Slack API warning | Safe to ignore |
| `Rate limit exceeded` | Too many requests | Wait or increase limits |

---

## Prevention Strategies

### 1. Configuration Management
```bash
# Create a verification script
cat > verify-config.sh << 'EOF'
#!/bin/bash
echo "Checking configuration..."
grep GITHUB_WORKFLOW_FILE wrangler.toml
ls -la .github/workflows/
wrangler secret list
EOF
```

### 2. Deployment Checklist
- [ ] All secrets set in both Worker and GitHub?
- [ ] Workflow file name matches wrangler.toml?
- [ ] Worker redeployed after changes?
- [ ] Test dispatch working?

### 3. Monitoring Setup
```bash
# Add to your deployment script
npm run deploy && \
wrangler tail &
TAIL_PID=$!
sleep 30
kill $TAIL_PID
```

---

## Getting Help

### Diagnostic Information to Collect

When reporting issues, include:

1. **Worker Logs:**
   ```bash
   wrangler tail > worker-logs.txt
   ```

2. **Workflow Configuration:**
   ```bash
   cat .github/workflows/claude-code-processor.yml
   ```

3. **Error Messages:**
   - Exact error text
   - HTTP status codes
   - Timestamps

4. **Configuration:**
   ```bash
   cat wrangler.toml | grep -E "(GITHUB|WORKFLOW)"
   ```

### Support Channels
- GitHub Issues: [Report bugs](https://github.com/jerryzhao173985/claude-slack-bot/issues)
- Discussions: [Ask questions](https://github.com/jerryzhao173985/claude-slack-bot/discussions)

---

## Emergency Recovery

If everything is broken:

1. **Reset Worker:**
   ```bash
   wrangler delete
   npm run deploy
   ```

2. **Verify Workflow:**
   ```bash
   # Use the original working version
   git checkout f9c1a7c -- .github/workflows/claude-code-processor.yml
   # Add back new features manually
   ```

3. **Test Minimal Setup:**
   - Remove all MCP servers except Slack
   - Use default model only
   - Disable Notion integration
   - Get basic functionality working first

---

*Remember: Most issues are configuration-related. When in doubt, redeploy the Worker!*