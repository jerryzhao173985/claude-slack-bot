# Claude Slack Bot - Implementation Guide

This project implements a Slack bot powered by Claude using the Model Context Protocol (MCP) for tool integration.

## Architecture

The bot uses a distributed architecture:
1. **Cloudflare Worker** - Handles Slack events quickly (<3s response time)
2. **GitHub Actions** - Runs Claude Code with MCP servers for processing

## How It Works

1. User mentions the bot in Slack: `@claude help me with this`
2. Worker immediately posts "🤔 Working on your request..."
3. Worker triggers GitHub Actions workflow
4. Claude processes the request with access to MCP tools
5. Claude saves the response to a file
6. Workflow updates the original Slack message with the response

## Important Implementation Details

### MCP Slack Server Limitations

The official `@modelcontextprotocol/server-slack` npm package provides these tools:
- `slack_post_message` - Post new messages
- `slack_reply_to_thread` - Reply to threads
- `slack_add_reaction` - Add emoji reactions
- `slack_get_channel_history` - Read channel messages
- Other read-only tools for users and channels

**Note**: There is NO message update tool in the MCP Slack server. This is why we handle message updates outside of MCP.

### Recommended Workflow

Use `claude-code-processor-best.yml` which:
1. Lets Claude use any MCP tools for processing
2. Asks Claude to save the final response to `slack_response.txt`
3. Updates the Slack placeholder message using the Slack API directly

This provides the cleanest user experience - the "Working..." message seamlessly transforms into Claude's response.

## Configuration

Set the workflow file in Cloudflare:
```bash
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor-best.yml"
```

## Available MCP Servers

Configure in the workflow based on user request:
- **slack** - Slack integration (read channels, post messages)
- **notion** - Notion API access
- **github** - GitHub repository access

## System Prompts

The system should instruct Claude to:
1. Process the user's question thoroughly
2. Use any necessary MCP tools
3. Save the final response to `slack_response.txt`
4. Format the response appropriately for Slack

## Model Configuration

Currently using: `claude-3-7-sonnet-20250219`

This model provides a good balance of capability and response time for Slack interactions.