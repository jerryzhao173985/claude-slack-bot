# 🤖 Claude Slack Bot

A powerful Slack bot powered by Claude with MCP (Model Context Protocol) integration. Features automatic Notion archiving, thread context awareness, thinking mode visualization, and seamless multi-model selection.

[![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=github-actions)](https://github.com/jerryzhao173985/claude-slack-bot/actions)
[![Cloudflare Workers](https://img.shields.io/badge/Edge-Cloudflare_Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Claude](https://img.shields.io/badge/AI-Claude_Sonnet-7C3AED?logo=anthropic)](https://www.anthropic.com/claude)
[![MCP](https://img.shields.io/badge/Protocol-MCP-22C55E)](https://modelcontextprotocol.io/)

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

> 📖 For complete setup, see [Deployment Guide](docs/DEPLOYMENT.md)

## ✨ Key Features

### 🧠 Smart Model Selection
Auto-selects the best Claude model for your task:
- **Sonnet 4** (🧠): Complex analysis, deep thinking
- **Sonnet 3.7** (🧠): Latest features, balanced performance  
- **Sonnet 3.5**: Fast responses, simple tasks

```slack
@claude /model advanced analyze this architecture
@claude using sonnet-3.5 quick calculation
@claude with model 4 write comprehensive docs
```

### 🐙 GitHub Repository Analysis (ENHANCED!)
Deep code analysis and repository management with natural language:

**Read & Analyze (Any Repository)**:
```slack
@claude analyze https://github.com/anthropics/claude-code
@claude find security issues in facebook/react
@claude explain the architecture of kubernetes/kubernetes
@claude what changed in nodejs/node recently?
```

**Write & Manage (Your Repositories)**:
```slack
@claude fix the typo in README.md in jerryzhao173985/my-project
@claude create a PR to add error handling
@claude open an issue about the performance problem
@claude review and merge PR #123
```

Features:
- 26+ GitHub tools for comprehensive operations
- Smart permissions: Full access to your repos, read-only for others
- Natural language understanding for complex tasks
- Support for all GitHub URL formats (including .git)
- File creation, branch management, PR operations, and more

### 📝 Automatic Notion Documentation
Every Q&A session is automatically saved to Notion with:
- Clean, searchable titles
- Full question and answer content
- Metadata (timestamp, channel, model used)
- Organized under "Claude Code" folder

### 🧵 Thread Context Awareness
The bot reads up to 50 previous messages in a thread:
```slack
User: First message about project X
User: Here are the requirements...
User: @claude summarize this thread
Claude: Based on the discussion above about project X...
```

### 💭 Thinking Mode Visualization
Visual indicators show when advanced models are thinking:
- Sonnet 4: "Working on your request (using Sonnet 4 🧠)..."
- Sonnet 3.7: "Working on your request (using Sonnet 3.7 🧠)..."
- Sonnet 3.5: "Working on your request (using Sonnet 3.5)..."

### 🔧 MCP Tool Integration
Three official MCP servers provide seamless integrations:
- **Slack**: Reply to threads, get user info, channel history
- **Notion**: Search and create pages, manage content
- **GitHub**: Access repos, create issues, manage PRs

### 🎯 Intelligent Turn Limit System
Automatically allocates 15-50 conversation turns based on task complexity:
- **Simple queries**: 15 turns (explanations, lookups)
- **Bug fixes**: 20 turns (debugging specific issues)
- **GitHub operations**: 25-35 turns (analyzing repos, creating PRs)
- **Major development**: 35+ turns (implementing features, refactoring)

### 🔄 Automatic Error Recovery
The bot now handles API errors gracefully:
- **Tool usage errors**: Smart detection and recovery guidance
- **Session preservation**: Continue where you left off with `@claude continue`
- **Detailed error messages**: Clear explanations and next steps
- **Complex multi-step**: Up to 50 turns (capped maximum)

See [Turn Limit Documentation](docs/turn-limit-system.md) for details.

### ⏱️ Dynamic Timeout & Session Management
Intelligent task handling with automatic continuation:

**Dynamic Timeout Calculation**:
- Base: 10 minutes for simple tasks
- Scales up to 45 minutes for complex operations
- Factors: GitHub operations, file count, analysis depth, MCP usage


**Automatic Session Management**:
```slack
@claude analyze entire codebase and create security audit
Claude: 🤔 Working on your request... [75%] - implementation phase
        ████████████████░░░░
        ✅ Made significant progress! I've completed the analysis. 
        To finish the security fixes, just say 'continue'.

User: continue
Claude: 🤔 Working on your request... (resuming session)
        [Continues from checkpoint with all context preserved]
```

**Smart Checkpointing**:
- Saves progress at critical phases
- Preserves state before risky operations
- Automatic recovery on timeout
- No manual session tracking needed

### 📊 Real-time Progress Monitoring
Live updates during complex tasks:
```
🤔 Working on your request... [40%] - analysis phase
████████░░░░░░░░░░░░
```

Progress updates every 30 seconds showing:
- Current completion percentage
- Active phase (analysis/implementation/testing/finalization)
- Visual progress bar

## 📚 Documentation

### 🚀 Getting Started
- [**Deployment Guide**](docs/DEPLOYMENT.md) - Complete setup instructions
- [**Quick Start**](docs/quick-start.md) - Get running in 10 minutes
- [**Troubleshooting**](docs/TROUBLESHOOTING.md) - Solve common issues

### 📖 Technical Documentation
- [**Technical Reference**](docs/TECHNICAL_REFERENCE.md) - Complete API and architecture details
- [**Architecture**](docs/architecture.md) - System design deep dive
- [**Features Guide**](docs/features.md) - All features explained

### 🐛 Issues & Fixes
- [**Issue Tracker**](docs/issues/) - All documented bugs and resolutions
- [**Critical Issues**](docs/critical-issues-and-fixes.md) - Major bugs summary

### 🔧 Configuration & Integration
- [**Notion Integration**](docs/notion-integration.md) - Set up Q&A archiving
- [**Maintenance Guide**](docs/maintenance.md) - Keep your bot healthy
- [**Fallback Options**](docs/fallback-options.md) - Alternative approaches

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    Slack    │────▶│ Cloudflare      │────▶│   GitHub     │
│   Events    │     │   Worker        │     │   Actions    │
└─────────────┘     └─────────────────┘     └──────────────┘
       ↓                    ↓                        ↓
   @mentions          Immediate              Claude Code + MCP
                      Response               (Slack, Notion, GitHub)
```

### Why This Architecture?
- **Cloudflare Workers**: <3s response time, global edge deployment
- **GitHub Actions**: Long-running Claude sessions, free tier
- **MCP Servers**: Official integrations, no custom code needed

## 🔧 Prerequisites

- Node.js 18+
- Cloudflare account with Workers enabled
- GitHub repository with Actions enabled
- Slack workspace with app creation permissions
- Claude API key from Anthropic
- Notion account (optional, for Q&A archiving)

## 💻 Setup Instructions

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
     - `channels:history` - Read channel history (for thread context)
     - `groups:history` - Read private channel history
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

## 💬 Usage Examples

### Basic Usage
```slack
@claude hello world
@claude explain quantum computing
@claude help me debug this code
```

### Model Selection

#### Slash Commands
```slack
@claude /model advanced analyze this complex dataset
@claude /model fast what's the weather?
@claude /mode smart write a comprehensive report
```

#### Named Presets
- `advanced` / `smart` / `deep` → Claude Sonnet 4 (Most capable)
- `fast` / `balanced` / `quick` → Claude 3.5 Sonnet (Default)
- `latest` / `newest` → Claude 3.7 Sonnet (Latest release)

#### Natural Language
```slack
@claude using sonnet-3.5 analyze this code
@claude with advanced model create a business plan
@claude model: 4 help me debug this issue
```

### Thread Context
```slack
@claude summarize this thread
@claude based on the discussion above, create an action plan
```

### The Bot Will:
1. Immediately respond with "🤔 Working on your request (using [Model] 🧠)..."
2. Process your request using the specified Claude model with MCP tools
3. Save Q&A to Notion (if configured)
4. Update the message with the final response

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

### Linting & Type Checking
```bash
npm run lint
npm run typecheck
```

### Verification & Debugging
```bash
# Verify deployment configuration
./verify-deployment.sh

# Test bot health
./test-bot.sh

# Quick configuration fix
./quick-fix.sh

# Comprehensive troubleshooting
./troubleshoot-dispatch.sh
```

## 🐛 Critical Issues Fixed

### The `mcp_tools` Parameter Bug
During development, a critical bug was discovered where the `mcp_tools` parameter was accidentally removed during refactoring, causing complete bot failure. This has been fixed and documented in detail.

**Key Lesson**: Always ensure workflow input parameters match what the Worker dispatches.

See [Critical Issues and Fixes](docs/critical-issues-and-fixes.md) for the complete story.

## 🔍 Troubleshooting

### Quick Diagnostics
```bash
# Check Worker deployment
wrangler deployments list

# Verify secrets are set
wrangler secret list

# Monitor real-time logs
wrangler tail

# Test workflow dispatch
curl https://your-worker.workers.dev/debug/test-dispatch
```

### Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Bot not responding | Check if bot is invited with `/invite @claude` |
| "Working..." never updates | Verify GitHub Actions running, check `mcp_tools` parameter |
| Notion pages empty | Ensure content is in `children` array during creation |
| Permission errors | Add `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true` |
| Wrong model used | Check exact command format and aliases |

For comprehensive troubleshooting, see [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

### Debug Endpoints

The Worker includes debug endpoints for testing:
- `/debug/config` - Check current configuration
- `/debug/test-dispatch` - Test GitHub workflow dispatch

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

Please ensure:
- All tests pass
- Code follows existing patterns
- Documentation is updated
- Workflow parameters are preserved

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code)
- Powered by [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Edge computing by [Cloudflare Workers](https://workers.cloudflare.com/)
- CI/CD by [GitHub Actions](https://github.com/features/actions)

---

Built with ❤️ using Claude Code SDK | [Report Issues](https://github.com/jerryzhao173985/claude-slack-bot/issues)