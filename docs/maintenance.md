# 🔧 Maintenance Guide

## Project Structure

```
claude-slack-bot/
├── src/                    # Source code
│   ├── index.ts           # Main entry point (Hono app)
│   ├── routes/            # API routes
│   │   ├── slack.ts       # Slack event handler
│   │   ├── health.ts      # Health check endpoint
│   │   └── docs.ts        # API documentation
│   ├── services/          # Business logic
│   │   ├── eventHandler.ts    # Processes Slack events & model selection
│   │   ├── githubDispatcher.ts # Triggers GitHub workflows
│   │   └── slackClient.ts     # Slack API interactions
│   ├── middleware/        # Middleware
│   │   └── verifySlack.ts # Slack signature verification
│   └── types/             # TypeScript types
│       └── env.ts         # Environment & interface definitions
├── .github/workflows/     # GitHub Actions
│   └── claude-code-processor.yml  # Main workflow with MCP servers
├── scripts/               # Utility scripts
│   └── prepare-mcp-config.sh  # Generates MCP configuration
└── Configuration files
    ├── wrangler.toml      # Cloudflare Worker config
    ├── package.json       # Dependencies
    └── tsconfig.json      # TypeScript config
```

## Key Components

### 1. Cloudflare Worker (Edge)
- **Purpose**: Handle Slack events within 3-second deadline
- **Key Files**: `src/index.ts`, `src/routes/slack.ts`
- **Responsibilities**:
  - Verify Slack signatures
  - Post placeholder message
  - Extract model preference
  - Trigger GitHub workflow

### 2. GitHub Actions (Runner)
- **Purpose**: Execute Claude with MCP servers
- **Key File**: `.github/workflows/claude-code-processor.yml`
- **Responsibilities**:
  - Run Claude Code with proper permissions
  - Connect MCP servers (Slack, Notion, GitHub)
  - Update Slack message with response

### 3. Model Selection Logic
- **Location**: `src/services/eventHandler.ts`
- **Features**:
  - Slash commands: `/model advanced`
  - Presets: `advanced`, `fast`, `latest`
  - Auto-detection of complex requests
  - Fallback to default model
  - Thinking mode indicator (🧠) for supported models

### 3b. Thinking Mode
- **Purpose**: Enable deeper reasoning for supported models
- **Configuration**: Dynamic in workflow based on model
- **Supported Models**:
  - ✅ Sonnet 4 (claude-sonnet-4-20250514)
  - ✅ Sonnet 3.7 (claude-3-7-sonnet-20250219)
  - ❌ Sonnet 3.5 (claude-3-5-sonnet-20241022)
- **Implementation**: `CLAUDE_CODE_THINKING` env var

### 4. Notion Integration
- **Purpose**: Save all Q&A sessions to Notion
- **Configuration**: `scripts/prepare-mcp-config.sh`
- **MCP Server**: `@notionhq/notion-mcp-server`
- **Features**:
  - Automatic page creation
  - Organized under "Claude Code" folder
  - Includes metadata and timestamps

### 5. Thread Context System
- **Components**:
  - `SlackClient.getThreadContext()`: Fetches up to 50 thread messages
  - `GitHubDispatcher.buildSystemPrompt()`: Formats thread history
  - Workflow: Uses `append_system_prompt` to pass context to Claude
- **Caching**:
  - Thread messages: 1 minute TTL
  - User names: 24 hour TTL
- **Features**:
  - Automatic thread detection
  - Chronological message ordering
  - User name resolution
  - Bot message indicators
  - Visual formatting with timestamps

## Common Tasks

### Adding a New Model

1. Update model aliases in `eventHandler.ts`:
```typescript
const modelAliases: Record<string, string> = {
  'new-model': 'claude-new-model-id',
  // ... existing models
};
```

2. Add display name:
```typescript
const displayNames: Record<string, string> = {
  'claude-new-model-id': 'New Model',
  // ... existing names
};
```

### Adding a New MCP Server

1. Edit `scripts/prepare-mcp-config.sh`:
```bash
"newServer": {
  "command": "npx",
  "args": ["-y","@provider/new-mcp-server"],
  "env": { "API_KEY":"${NEW_API_KEY}" }
}
```

2. Add secrets to GitHub repository settings

3. Update workflow if needed

### Debugging Issues

1. **Check Cloudflare Logs**:
```bash
wrangler tail
```

2. **View GitHub Actions**:
- Go to Actions tab in GitHub
- Check workflow runs
- Look for "Claude Code Processor Ultimate"

3. **Test Locally**:
```bash
npm run dev
```

## Deployment

### Standard Deployment
```bash
./deploy.sh
```

### Manual Deployment
```bash
wrangler deploy
```

### Rollback
```bash
wrangler rollback
```

## Environment Variables

### Cloudflare (wrangler.toml)
- `GITHUB_OWNER`: Repository owner
- `GITHUB_REPO`: Repository name  
- `GITHUB_WORKFLOW_FILE`: Workflow to trigger

### Cloudflare Secrets
```bash
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GITHUB_TOKEN
```

### GitHub Secrets
- `ANTHROPIC_API_KEY`: Claude API key
- `SLACK_BOT_TOKEN`: Same as Cloudflare
- `SLACK_TEAM_ID`: Slack workspace ID
- `NOTION_KEY`: (Optional) Notion integration
- `GH_TOKEN`: GitHub access token

## Performance Considerations

1. **Worker Limits**:
   - 10ms CPU time per request
   - 1MB bundle size
   - Must respond within 3 seconds

2. **Optimization**:
   - Minimal dependencies
   - Async operations
   - Early response to Slack

3. **Caching**:
   - Thread context cached in KV
   - 50 message limit per thread

## Security

1. **Slack Verification**:
   - All requests verified with HMAC
   - Timestamp validation (5-minute window)

2. **Secret Management**:
   - Never commit secrets
   - Use wrangler secrets for sensitive data
   - Rotate tokens regularly

3. **Rate Limiting**:
   - 10 requests per minute per user
   - Implemented in `rateLimiter.ts`

## Monitoring

1. **Metrics to Track**:
   - Response times
   - Model usage distribution
   - Error rates
   - GitHub workflow success rate

2. **Alerts**:
   - Set up Cloudflare alerts for errors
   - Monitor GitHub Actions failures
   - Track Slack API rate limits

## Best Practices

1. **Code Changes**:
   - Test locally first
   - Update TypeScript types
   - Run linting: `npm run lint`
   - Check types: `npm run typecheck`

2. **Deployment**:
   - Always use `deploy.sh` script
   - Monitor logs after deployment
   - Test in Slack immediately

3. **Documentation**:
   - Update README for user-facing changes
   - Update this guide for technical changes
   - Comment complex logic in code

## Troubleshooting Checklist

- [ ] Correct workflow in wrangler.toml?
- [ ] All secrets set correctly?
- [ ] Bot invited to Slack channel?
- [ ] GitHub Actions enabled?
- [ ] Cloudflare Worker deployed?
- [ ] Slack app configured properly?

## Test Scripts

### quick-fix.sh

The `quick-fix.sh` script provides an interactive way to configure your bot's workflow:

```bash
./quick-fix.sh
```

**Features:**
- Interactive workflow selection menu
- Automatically updates Cloudflare configuration
- Provides clear next steps

**Options:**
1. **Best Experience** - Full MCP support with message updates (recommended)
2. **Simple & Fast** - Direct API calls without MCP
3. **Thread Replies** - Uses available MCP tools but replies in thread
4. **Direct V2** - Improved simple workflow (most reliable)

**Usage Example:**
```bash
$ ./quick-fix.sh
🔧 Fixing Claude Slack Bot message updates...

Choose your preferred solution:

1) Best Experience (Recommended) - Full MCP support with message updates
2) Simple & Fast - Direct API calls, no MCP
3) Thread Replies - Uses available MCP tools
4) Direct V2 - Improved simple workflow (most reliable)

Enter your choice (1-4): 1
✅ Selected: Best Experience workflow
🚀 Updating Cloudflare Worker configuration...
✅ Configuration updated successfully!
```

### test-bot.sh

The `test-bot.sh` script helps you verify your bot setup:

```bash
./test-bot.sh
```

**Features:**
- Tests local build
- Provides test message examples
- Shows expected behavior
- Lists monitoring commands

**Test Messages Provided:**
1. **Simple test**: `@claude what is 2+2?`
2. **With context**: `@claude can you help me understand this error message?`
3. **With MCP tools**: `@claude check my recent github commits`

**Expected Behavior:**
1. Bot responds immediately with "🤔 Working on your request..."
2. Within 30-60 seconds, message updates with Claude's response
3. No extra messages or thread replies (with recommended workflow)

### verify-deployment.sh

Comprehensive pre-deployment verification:

```bash
./verify-deployment.sh
```

**Checks:**
- Prerequisites (Node.js, npm, wrangler)
- Project structure integrity
- Configuration file validity
- Build process success
- TypeScript compliance
- Secret configuration

### Manual Testing Commands

**Test Slack API:**
```bash
# Verify bot authentication
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"

# Test posting a message
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C1234567890",
    "text": "Test message from bot"
  }'
```

**Test Claude API:**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Support

For issues:
1. Check logs (Cloudflare & GitHub)
2. Review this maintenance guide
3. See [Troubleshooting Guide](troubleshooting.md)
4. Use test scripts for diagnosis
5. Create GitHub issue with details