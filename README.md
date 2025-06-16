# Claude Slack Bot

A powerful Slack bot powered by Claude with MCP (Model Context Protocol) integration. Features automatic Notion archiving, thread context awareness, and seamless model selection.

## 🚀 Quick Start

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/claude-slack-bot.git
   cd claude-slack-bot
   npm install
   ```

2. **Add Secrets** (GitHub & Cloudflare)
3. **Deploy**: `npm run deploy`
4. **Configure Slack App**
5. **Start using**: `@claude hello!`

> 📖 See [Quick Start Guide](docs/quick-start.md) for detailed setup instructions.

## ✨ Key Features

- **🧠 Smart Model Selection**: Auto-selects best model for your task
- **📝 Notion Integration**: Every Q&A automatically saved
- **🧵 Thread Context**: Full conversation awareness
- **💭 Thinking Mode**: Visual indicator for deep reasoning
- **🔧 MCP Tools**: Slack, Notion, GitHub integrations

## 📚 Documentation

- [Quick Start Guide](docs/quick-start.md) - Get running in 10 minutes
- [Deployment Guide](docs/deployment.md) - Complete deployment walkthrough
- [Features Guide](docs/features.md) - All features explained
- [Notion Integration](docs/notion-integration.md) - Set up Q&A archiving
- [Architecture Guide](docs/architecture.md) - Technical deep dive
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues & solutions
- [Maintenance Guide](docs/maintenance.md) - Keep your bot healthy
- [Fallback Options](docs/fallback-options.md) - Simpler alternatives if MCP fails

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    Slack    │────▶│ Cloudflare      │────▶│   GitHub     │
│   Events    │     │   Worker        │     │   Actions    │
└─────────────┘     └─────────────────┘     └──────────────┘
                           │                        │
                           ▼                        ▼
                    ┌─────────────┐         ┌──────────────┐
                    │  Immediate  │         │ Claude Code  │
                    │  Response   │         │   + MCP      │
                    └─────────────┘         └──────────────┘
```

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
- `NOTION_KEY`: Notion integration key (required for Q&A history)
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
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"

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

## 💬 Usage

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

## 🛠️ Development

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

### Verification
```bash
./verify-deployment.sh  # Check deployment readiness
```

## MCP Tools Available

- **Slack**: Read/write messages, manage channels
- **Notion**: Access and modify Notion pages (Q&A automatically saved)
- **GitHub**: Interact with repositories, issues, PRs
- **Claude Code Tools**: File operations, web search, and more

### Notion Integration

Every question and response is automatically saved to your Notion workspace:
- Creates pages under a "Claude Code" folder
- Each Q&A session becomes a separate page
- Includes metadata: timestamp, channel, model used
- Fully searchable history of all interactions

## Extending the Bot

### Adding New MCP Servers

1. Edit `scripts/prepare-mcp-config.sh`
2. Add the new server configuration
3. Update GitHub secrets if needed
4. Redeploy

### Customizing Bot Behavior

- Modify `src/services/eventHandler.ts` to change tool selection logic
- Update `src/services/githubDispatcher.ts` to customize system prompts
- Edit workflow in `.github/workflows/claude-code-processor.yml`

## Troubleshooting

For comprehensive troubleshooting, see our [Troubleshooting Guide](docs/troubleshooting.md).

### Quick Fixes

1. **Bot not responding**: Check if bot is invited to channel with `/invite @claude`
2. **"Working..." never updates**: Verify GitHub Actions are running
3. **Permission errors**: Ensure bot has `chat:write` scope in Slack app settings
4. **Notion not saving**: Create and share "Claude Code" page with integration

### Test Scripts

```bash
# Quick configuration fix
./quick-fix.sh

# Test bot setup
./test-bot.sh

# Verify deployment
./verify-deployment.sh
```

### Debug Commands

```bash
# View Worker logs
wrangler tail

# Test locally
npm run dev

# Check TypeScript errors
npm run typecheck

# Monitor GitHub Actions
# Go to: github.com/yourusername/repo/actions

# Test Slack signature locally
curl -X POST http://localhost:8787/slack/events \
  -H "Content-Type: application/json" \
  -H "X-Slack-Signature: v0=..." \
  -H "X-Slack-Request-Timestamp: ..." \
  -d '{"event": {...}}'
```

### Monitoring

- **Real-time logs**: `wrangler tail`
- **GitHub Actions**: Check workflow runs in Actions tab
- **Slack Activity**: App management console shows metrics
- **Notion Pages**: Check "Claude Code" folder for saved Q&As

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

---

Built with ❤️ using Claude Code SDK