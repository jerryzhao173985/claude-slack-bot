# 🚀 Fix Instructions for Claude Slack Bot

## The Problem
Based on your logs, the issue is that:
1. MCP Slack server doesn't have a `chat_update` tool (only `post_message` and `reply_to_thread`)
2. Claude Code is having permission issues with MCP tools
3. The current workflows are trying to use tools that don't exist

## The Solution

I've created two new workflows that avoid these issues:

### Option 1: `claude-simple-working.yml` (Recommended)
- **Simplest and most reliable**
- Directly calls Claude API and Slack API
- No MCP complexity
- Will definitely work

### Option 2: `claude-code-working.yml`
- Uses Claude Code SDK without MCP
- Claude saves response to file
- Separate step updates Slack

## Steps to Fix Your Bot

### 1. Update the Cloudflare secret:
```bash
wrangler secret delete GITHUB_WORKFLOW_FILE
wrangler secret put GITHUB_WORKFLOW_FILE
```
When prompted, enter: `claude-code-processor-final.yml`

### 2. Push the new workflows to GitHub:
```bash
git add .
git commit -m "Add working workflows without MCP complexity"
git push
```

### 3. Test your bot:
Go to Slack and type:
```
@claude what is 2+2?
```

## Expected Result
1. Bot responds immediately: "🤔 Working on your request..."
2. Within 10-30 seconds, that message updates to show Claude's answer
3. No permission errors, no MCP issues

## Why This Works

The new workflows:
- Don't rely on non-existent MCP tools
- Use direct API calls that we know work
- Handle errors gracefully
- Have clear debug output

## If You Still Have Issues

Check:
1. **SLACK_BOT_TOKEN** has `chat:write` scope
2. **ANTHROPIC_API_KEY** is valid
3. GitHub Actions logs for any error messages

## Alternative Models

The workflows use `claude-3-5-sonnet-20241022` but you can change to:
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

Just update the `model` field in the workflow.