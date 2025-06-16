# 🔄 Fallback Options

## Overview

If you encounter issues with MCP servers or need a simpler setup, here are fallback options for running the Claude Slack Bot.

## Direct API Workflow (No MCP)

If MCP servers are causing issues, you can create a simplified workflow that uses Claude's API directly:

### Create `.github/workflows/claude-direct-api.yml`:

```yaml
name: Claude Direct API Fallback

on:
  workflow_dispatch:
    inputs:
      question:
        description: "User question from Slack"
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
        description: "Slack thread timestamp"
        required: false
        type: string

jobs:
  respond:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    
    steps:
      - name: Process with Claude and Update Slack
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        run: |
          # Prepare the question for JSON
          QUESTION=$(echo "${{ github.event.inputs.question }}" | jq -Rs .)
          
          # Call Claude API
          RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
            -H "x-api-key: $ANTHROPIC_API_KEY" \
            -H "anthropic-version: 2023-06-01" \
            -H "content-type: application/json" \
            -d "{
              \"model\": \"claude-3-5-sonnet-20241022\",
              \"max_tokens\": 2000,
              \"messages\": [{
                \"role\": \"user\",
                \"content\": $QUESTION
              }]
            }")
          
          # Extract the response text
          RESPONSE_TEXT=$(echo "$RESPONSE" | jq -r '.content[0].text // "Error processing request"')
          
          # Update Slack
          curl -X POST https://slack.com/api/chat.update \
            -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
              \"channel\": \"${{ github.event.inputs.slack_channel }}\",
              \"ts\": \"${{ github.event.inputs.slack_ts }}\",
              \"text\": \"$RESPONSE_TEXT\"
            }"
```

### Update Worker Configuration

In `wrangler.toml`, change:
```toml
GITHUB_WORKFLOW_FILE = "claude-direct-api.yml"
```

### Limitations

This fallback approach:
- ❌ No MCP tool access (Notion, GitHub integration)
- ❌ No thread context awareness
- ❌ Limited to basic Q&A
- ✅ More reliable if MCP is causing issues
- ✅ Simpler to debug

## Manual MCP Testing

To test MCP servers manually:

```bash
# Test Notion MCP
npx @notionhq/notion-mcp-server

# Test Slack MCP
npx @modelcontextprotocol/server-slack

# Test GitHub MCP
npx @modelcontextprotocol/server-github
```

## Environment Variable Fallbacks

If certain features aren't working, you can disable them:

```yaml
# Disable thinking mode
CLAUDE_CODE_THINKING=false

# Skip MCP permissions
CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true

# Disable prompt caching
ANTHROPIC_PROMPT_CACHING=0
```

## Progressive Deployment

1. **Start Simple**: Deploy with direct API first
2. **Add MCP**: Once working, add MCP servers one by one
3. **Enable Features**: Gradually enable thread context, Notion saving, etc.

## Debugging MCP Issues

If MCP servers fail to connect:

1. Check npm package availability:
   ```bash
   npm view @notionhq/notion-mcp-server
   npm view @modelcontextprotocol/server-slack
   ```

2. Verify environment variables in workflow:
   ```yaml
   - name: Debug Environment
     run: |
       echo "Has Notion Key: ${{ secrets.NOTION_KEY != '' }}"
       echo "Has Slack Token: ${{ secrets.SLACK_BOT_TOKEN != '' }}"
   ```

3. Test with minimal MCP config:
   ```json
   {
     "mcpServers": {
       "slack": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-slack"],
         "env": { 
           "SLACK_BOT_TOKEN": "${{ secrets.SLACK_BOT_TOKEN }}",
           "SLACK_TEAM_ID": "${{ secrets.SLACK_TEAM_ID }}" 
         }
       }
     }
   }
   ```

## When to Use Fallbacks

Consider fallback options when:
- MCP servers consistently fail
- You need a quick proof of concept
- Debugging complex integration issues
- Running in restricted environments
- Cost optimization (fewer GitHub Action minutes)