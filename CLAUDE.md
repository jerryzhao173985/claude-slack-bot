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

### Workflow Differences

**Best Experience Workflow:**
- Claude processes the request using MCP tools
- Saves the complete response to `outputs/slack_response.txt`
- Workflow updates the "Working..." placeholder message
- Result: Clean, seamless message update

**Legacy Workflow:**
- Claude uses `slack_reply_to_thread` MCP tool
- Falls back to file save if MCP fails
- Result: New message in thread (not as clean)

## Configuration

### Choose Your Workflow

Two workflows are available:

1. **`claude-code-processor-best.yml`** (Recommended)
   - Updates the placeholder message for seamless experience
   - Claude saves response to file, workflow handles Slack update
   - No duplicate messages in threads

2. **`claude-code-processor.yml`** (Legacy)
   - Uses MCP to reply to thread (creates new message)
   - Fallback saves to file if MCP fails
   - May result in duplicate messages

Set the workflow file in Cloudflare:
```bash
# Recommended
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor-best.yml"

# Or legacy
wrangler secret put GITHUB_WORKFLOW_FILE --value "claude-code-processor.yml"
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

## GitHub Integration (Fully Enhanced)

The bot now includes comprehensive GitHub capabilities with intelligent permission handling:

### Features
- **Natural Language Commands**: Full spectrum from analysis to repository management
- **Smart Permissions**: Full access to your repos, read-only for others
- **URL Pattern Support**: Handles .git URLs, SSH format, direct links
- **26+ Tools**: Complete GitHub API coverage through MCP

### Read Operations (Any Repository)
```
@claude analyze https://github.com/anthropics/claude-code
@claude find security issues in facebook/react
@claude explain https://github.com/nodejs/node/blob/main/lib/fs.js
@claude what recent changes were made to kubernetes/kubernetes?
```

### Write Operations (Your Repositories)
```
@claude fix the typo in README.md in jerryzhao173985/my-project
@claude create a branch feature/new-api
@claude create a PR from feature/new-api to main
@claude open an issue about the API performance
@claude review and merge PR #123
```

### Configuration
Using the official `github-mcp-server` from GitHub (https://github.com/github/github-mcp-server):
- Distributed as binary (not npm package)
- Requires `stdio` argument for MCP communication
- Uses `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable
- Supports all toolsets for complete GitHub API access
- Provides repository management, file operations, PR/issue handling, and more

### How It Works
1. **Repository Detection**: Automatically detects various GitHub URL formats
2. **Ownership Check**: Compares repository owner with configured username
3. **Tool Selection**: Enables appropriate tools based on permissions
4. **Context Building**: Provides rich context to Claude for better assistance

The system intelligently determines access level and available operations based on repository ownership.