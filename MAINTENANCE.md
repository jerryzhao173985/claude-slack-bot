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
│   ├── claude-code-processor-ultimate.yml  # Main workflow (with MCP)
│   └── claude-code-direct-api.yml         # Fallback (direct API)
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
- **Key File**: `.github/workflows/claude-code-processor-ultimate.yml`
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

## Support

For issues:
1. Check logs (Cloudflare & GitHub)
2. Review this maintenance guide
3. Check README troubleshooting section
4. Create GitHub issue with details