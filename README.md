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
- [Maintenance Guide](docs/maintenance.md) - Keep your bot healthy

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

## 💬 Usage Examples

### Basic Usage
```
@claude what is machine learning?
@claude help me debug this Python code
@claude summarize this thread
```

### Model Selection
```
@claude /model advanced write a technical spec
@claude using sonnet-4 analyze this dataset
@claude fast mode what's 2+2?
```

### Available Models
- **Claude 3.5 Sonnet** (default) - Fast, balanced
- **Claude 3.7 Sonnet** - Latest features
- **Claude Sonnet 4** - Most capable, deep thinking

## 🛠️ Development

```bash
npm run dev        # Local development
npm run build      # Build for production
npm run deploy     # Deploy to Cloudflare
npm run typecheck  # Check TypeScript
wrangler tail      # View live logs
./verify-deployment.sh  # Verify setup
```

## 🔧 Configuration

### Required Secrets

**GitHub Repository:**
- `ANTHROPIC_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_TEAM_ID`
- `NOTION_KEY`
- `GH_TOKEN`

**Cloudflare Worker:**
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `GITHUB_TOKEN`

### Environment Setup

1. **KV Namespace**: Create for thread caching
2. **Slack App**: Configure with proper scopes
3. **Notion Integration**: Grant page access

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

---

Built with ❤️ using Claude Code SDK