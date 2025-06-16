# Fixing Slack Message Update Issue

## Problem
Claude is not properly updating the placeholder Slack message with the response.

## Solution

### Option 1: Use the Update-Specific Workflow (Recommended)

1. Update your Cloudflare Worker environment variable:
```bash
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor-update.yml"
```

2. The new workflow explicitly instructs Claude to use `chat_update` instead of posting new messages.

### Option 2: Use the Hybrid Workflow (Recommended Alternative)

1. Update your Cloudflare Worker environment variable:
```bash
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor-hybrid.yml"
```

2. This workflow asks Claude to save the response to a file, then updates Slack directly.

### Option 3: Use the Simple Workflow (Basic Fallback)

1. Update your Cloudflare Worker environment variable:
```bash
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor-simple.yml"
```

2. This workflow bypasses MCP entirely and directly calls both APIs.

### Option 4: Debug MCP Permissions

1. Check GitHub Actions logs to see exact MCP tool calls
2. Ensure the Slack bot token has these scopes:
   - `chat:write`
   - `chat:write.public`
   - `channels:read`
   - `users:read`

### Testing

After making changes:

1. Mention the bot in Slack: `@claude what is 2+2?`
2. Check that the "Working on your request..." message gets replaced
3. Monitor logs:
   ```bash
   # Worker logs
   wrangler tail
   
   # GitHub Actions logs
   # Go to GitHub > Actions tab
   ```

### Current Configuration

- Model: `claude-3-7-sonnet-20250219`
- Workflow files available:
  - `claude-code-processor.yml` - Original with reply_to_thread
  - `claude-code-processor-update.yml` - Explicit chat_update instructions
  - `claude-code-processor-simple.yml` - Direct API calls (no MCP)

### If Still Not Working

The placeholder message details are logged in the Worker:
```
Placeholder message created {
  placeholderTs: "1234567890.123456",
  channel: "C1234567890",
  threadTs: "1234567890.123456"
}
```

Verify these values are being passed correctly to the GitHub workflow.