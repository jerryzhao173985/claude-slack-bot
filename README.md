# Claude Slack Bot

A Slack bot powered by Claude with MCP (Model Context Protocol) integration. This bot uses a distributed architecture with Cloudflare Workers for handling Slack events and GitHub Actions for running Claude Code with MCP servers.

## Quick Start

1. Fork/clone this repository
2. Set up secrets in GitHub and Cloudflare
3. Deploy the Worker: `npm run deploy`
4. Create and configure a Slack app
5. Start mentioning `@claude` in Slack!

## Architecture Overview

- **Edge Component**: Cloudflare Worker (Hono framework) handles Slack events in <3s
- **Runner Component**: GitHub Actions workflow executes Claude Code with MCP servers
- **MCP Servers**: Official integrations for Slack, Notion, and GitHub

## Prerequisites

- Node.js 18+
- Cloudflare account with Workers enabled
- GitHub repository with Actions enabled
- Slack workspace with app creation permissions
- Claude API key from Anthropic

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/claude-slack-bot.git
cd claude-slack-bot
npm install
```

### 2. Configure Secrets

#### GitHub Repository Secrets
Add these secrets to your GitHub repository (Settings > Secrets > Actions):
- `ANTHROPIC_API_KEY`: Your Claude API key from Anthropic Console
- `SLACK_BOT_TOKEN`: Slack bot token (starts with `xoxb-`)
- `SLACK_TEAM_ID`: Your Slack team/workspace ID (e.g., T1234567890)
- `NOTION_KEY`: Notion integration key (optional, for Notion MCP)
- `GH_TOKEN`: GitHub personal access token with `repo` scope

#### Cloudflare Worker Secrets
```bash
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GITHUB_TOKEN
```

> **Note**: The SLACK_BOT_TOKEN is needed in both places - Cloudflare Worker (for immediate responses) and GitHub Actions (for MCP server).

### 3. Create Cloudflare KV Namespace

```bash
wrangler kv:namespace create "THREAD_CACHE"
```

Update the `wrangler.toml` with the namespace ID returned.

### 4. Update Configuration

Edit `wrangler.toml`:
```toml
[vars]
GITHUB_OWNER = "your-github-username"
GITHUB_REPO = "your-repo-name"
GITHUB_WORKFLOW_FILE = "claude-code-processor-ultimate.yml"

[[kv_namespaces]]
binding = "THREAD_CACHE"
id = "your-kv-namespace-id"
```

### 5. Deploy Cloudflare Worker

```bash
npm run deploy
```

Note the deployed URL (e.g., `https://claude-slack-bot.youraccount.workers.dev`)

### 6. Configure Slack App

1. **Create a new Slack app** at https://api.slack.com/apps
   - Choose "From scratch"
   - Name your app (e.g., "Claude Bot")
   - Select your workspace

2. **Basic Information**:
   - Copy the **Signing Secret** (you'll need this for `SLACK_SIGNING_SECRET`)

3. **OAuth & Permissions**:
   - Add OAuth Scopes under "Bot Token Scopes":
     - `app_mentions:read` - To receive mentions
     - `chat:write` - To post messages
     - `users:read` - To resolve user names
     - `chat:write.public` - To post in public channels (optional)
   - Install to Workspace
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

4. **Event Subscriptions**:
   - Enable Events
   - Request URL: `https://your-worker-url.workers.dev/slack/events`
   - Wait for verification (your Worker must be deployed first)
   - Subscribe to bot events:
     - `app_mention` - When someone mentions your bot
   - Save changes

5. **App Home** (optional):
   - Configure display name and default username
   - Add a bot description

### 7. Invite Bot to Channels

Invite your bot to Slack channels where you want to use it:
```
/invite @your-bot-name
```

## Usage

Mention the bot in any channel:
```
@claude summarize this thread
@claude help me with notion integration
@claude check my github pull requests
```

### Model Selection

You can specify which Claude model to use with multiple patterns:

#### Slash Commands (NEW!)
```
@claude /model advanced analyze this complex dataset
@claude /model fast what's the weather?
@claude /mode smart write a comprehensive report
```

#### Named Presets (NEW!)
- `advanced` / `smart` / `deep` → Claude Sonnet 4 (Most capable)
- `fast` / `balanced` / `quick` → Claude 3.5 Sonnet (Default)
- `latest` / `newest` → Claude 3.7 Sonnet (Latest release)

#### Natural Language
```
@claude using sonnet-3.5 analyze this code
@claude with advanced model create a business plan
@claude model: 4 help me debug this issue
```

#### Available Models
- `claude-3-7-sonnet-20250219` (aliases: `sonnet-3.7`, `3.7`, `latest`)
- `claude-3-5-sonnet-20241022` (aliases: `sonnet-3.5`, `3.5`, `fast`) - default
- `claude-sonnet-4-20250514` (aliases: `sonnet-4`, `opus-4`, `4`, `advanced`)

#### Auto-Selection
The bot automatically uses the advanced model when detecting complex requests:
```
@claude write a comprehensive analysis of our data
@claude create a detailed technical specification
```

If no model is specified, the bot will use Claude 3.5 Sonnet by default.

The bot will:
1. Immediately respond with "🤔 Working on your request..."
2. Process your request using the specified Claude model with MCP tools
3. Update the message with the final response

## Development

### Local Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
npm run typecheck
```

## MCP Tools Available

- **Slack**: Read/write messages, manage channels
- **Notion**: Access and modify Notion pages
- **GitHub**: Interact with repositories, issues, PRs
- **Claude Code Tools**: File operations, web search, and more

## Extending the Bot

### Adding New MCP Servers

1. Edit `scripts/prepare-mcp-config.sh`
2. Add the new server configuration
3. Update GitHub secrets if needed
4. Redeploy

### Customizing Bot Behavior

- Modify `src/services/eventHandler.ts` to change tool selection logic
- Update `src/services/githubDispatcher.ts` to customize system prompts
- Edit workflow in `.github/workflows/claude-code-processor-ultimate.yml`

## Troubleshooting

### Common Issues

1. **Slack signature verification fails**
   - Ensure `SLACK_SIGNING_SECRET` is correctly set
   - Check request timestamps aren't stale

2. **GitHub workflow not triggering**
   - Verify `GITHUB_TOKEN` has correct permissions
   - Check workflow file path matches configuration

3. **Bot not responding**
   - Check Cloudflare Worker logs: `wrangler tail`
   - Verify Slack app is properly configured
   - Ensure bot is invited to the channel

4. **Model selection not working**
   - Ensure you've deployed the latest Worker: `wrangler deploy`
   - Check that `wrangler.toml` uses `claude-code-processor-ultimate.yml`
   - Verify the model name in your Slack message is valid

### Debug Commands

```bash
# View Worker logs
wrangler tail

# Test locally
npm run dev

# Check TypeScript errors
npm run typecheck
```

## License

MIT