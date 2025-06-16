# 🚨 Claude Slack Bot - Complete Fix Guide

## The Core Issue

Your bot isn't working because:
1. **MCP Slack server doesn't have a message update tool** - only post and reply
2. **Claude Code SDK has permission issues** with MCP tools in GitHub Actions
3. **Current workflows are trying to use non-existent tools**

## Immediate Fix (Do This Now!)

### Step 1: Update Cloudflare Configuration
```bash
# Delete old configuration
wrangler secret delete GITHUB_WORKFLOW_FILE

# Add new configuration
wrangler secret put GITHUB_WORKFLOW_FILE
# When prompted, enter: claude-simple-working.yml
```

### Step 2: Push New Workflows
```bash
git add .
git commit -m "Fix Slack bot with working workflows"
git push
```

### Step 3: Test Your Bot
In Slack, type:
```
@claude what is 2+2?
```

You should see:
1. "🤔 Working on your request..." (immediately)
2. "4" (within 10-30 seconds, replacing the first message)

## Why Previous Attempts Failed

### ❌ What we tried:
- Using `mcp__slack__chat_update` - **doesn't exist**
- Using `mcp__slack__slack_reply_to_thread` - creates new messages, doesn't update
- Complex MCP configurations - permission issues

### ✅ What works:
- Direct API calls to Claude and Slack
- No MCP complexity
- Simple, reliable, fast

## Available Workflows

### 1. `claude-simple-working.yml` ⭐ RECOMMENDED
- Directly calls APIs
- No dependencies
- Most reliable

### 2. `claude-code-working.yml`
- Uses Claude Code SDK (no MCP)
- Good for complex tasks
- Still reliable

### 3. Others (not recommended)
- Have MCP issues
- Won't update messages properly

## Debugging

### Check Slack Permissions:
```bash
export SLACK_BOT_TOKEN='your-bot-token'
./debug-slack-permissions.sh
```

### Monitor Logs:
```bash
# Cloudflare Worker
wrangler tail

# GitHub Actions
# Check Actions tab in your repo
```

## Common Issues

### "not_authed" error
- Check SLACK_BOT_TOKEN in GitHub secrets
- Ensure token starts with `xoxb-`

### Message not updating
- Verify bot has `chat:write` scope
- Check channel ID is correct
- Ensure message timestamp is valid

### No response at all
- Check ANTHROPIC_API_KEY is set
- Verify GitHub Actions ran
- Check Cloudflare logs

## Next Steps

After your bot is working:

1. **Add more features**: Modify prompts in workflows
2. **Add context**: Include thread history in prompts
3. **Add MCP later**: Once basic functionality works

## Success Checklist

- [ ] Updated Cloudflare secret to `claude-simple-working.yml`
- [ ] Pushed new workflows to GitHub
- [ ] Bot responds to mentions
- [ ] Messages update (not reply)
- [ ] No permission errors in logs

---

**Remember**: Start simple, get it working, then add complexity. The `claude-simple-working.yml` workflow will definitely work!