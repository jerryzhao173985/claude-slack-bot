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

## GitHub Integration (Complete MCP Implementation)

The bot now includes comprehensive GitHub capabilities with all 50+ MCP tools properly configured:

### Features
- **Natural Language Commands**: Full spectrum from analysis to repository management
- **Smart Permissions**: Full access to your repos, read-only for others
- **URL Pattern Support**: Handles .git URLs, SSH format, direct links
- **50+ Tools**: Complete GitHub API coverage through MCP v0.5.0

### Tool Categories

#### 📁 Repository Operations
- Search, create, fork repositories
- Manage branches and tags
- File operations (read, create, update, delete)
- Multi-file commits with `push_files`

#### 🐛 Issue Management
- Create, update, search issues
- Add comments and manage labels
- Assign Copilot for assistance

#### 🔀 Pull Request Operations
- Create, review, merge PRs
- Add review comments
- Request Copilot reviews
- Check PR status and diffs

#### 🔔 Notifications
- List and manage notifications
- Configure notification subscriptions

#### 🔒 Security Scanning
- Code scanning alerts
- Secret scanning alerts

### Read Operations (Any Repository)
```
@claude analyze https://github.com/anthropics/claude-code
@claude find security issues in facebook/react
@claude explain https://github.com/nodejs/node/blob/main/lib/fs.js
@claude what recent changes were made to kubernetes/kubernetes?
@claude check code scanning alerts for my-org/my-app
```

### Write Operations (Your Repositories)
```
@claude fix the typo in README.md in jerryzhao173985/my-project
@claude create a branch feature/new-api
@claude create a PR from feature/new-api to main
@claude open an issue about the API performance
@claude review and merge PR #123
@claude request Copilot to review my PR
```

### Configuration
Using the official `github-mcp-server` v0.5.0 from GitHub:
- Binary distribution with stdio communication
- Full toolset enabled with `--toolsets all`
- Authenticated via `GITHUB_PERSONAL_ACCESS_TOKEN`
- All 50+ GitHub MCP tools properly allowed in workflows

### Security Model
- Permission-based architecture
- Read-only by default
- Explicit permissions required for writes
- User-controlled MCP server configuration

### How It Works
1. **Repository Detection**: Automatically detects various GitHub URL formats
2. **Ownership Check**: Compares repository owner with configured username
3. **Tool Selection**: Enables appropriate tools based on permissions
4. **Context Building**: Provides rich context to Claude for better assistance

The system includes all GitHub MCP tools to prevent permission errors and enable full GitHub API functionality.