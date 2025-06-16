# 🚀 Deployment Guide

This guide covers the complete deployment process for the Claude Slack Bot.

## Pre-deployment Checklist

Run the verification script to ensure everything is ready:

```bash
./verify-deployment.sh
```

This checks:
- ✅ Prerequisites (Node.js, npm, wrangler)
- ✅ Project structure
- ✅ Configuration files
- ✅ Build process
- ✅ TypeScript compliance

## Step 1: GitHub Setup

### 1.1 Fork/Clone Repository

```bash
git clone https://github.com/yourusername/claude-slack-bot.git
cd claude-slack-bot
npm install
```

### 1.2 Add GitHub Secrets

Go to your repository → Settings → Secrets → Actions and add:

| Secret | Description | Example |
|--------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `SLACK_BOT_TOKEN` | Slack bot token | `xoxb-...` |
| `SLACK_TEAM_ID` | Workspace ID | `T0123456789` |
| `NOTION_KEY` | Notion integration | `secret_...` |
| `GH_TOKEN` | GitHub PAT | `ghp_...` |

## Step 2: Cloudflare Setup

### 2.1 Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2.2 Create KV Namespace

```bash
wrangler kv:namespace create "THREAD_CACHE"
```

Output example:
```
✨ Success!
Add the following to your wrangler.toml:
kv_namespaces = [
  { binding = "THREAD_CACHE", id = "abcd1234..." }
]
```

### 2.3 Update wrangler.toml

```toml
name = "claude-slack-bot"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
GITHUB_OWNER = "yourusername"
GITHUB_REPO = "claude-slack-bot"
GITHUB_WORKFLOW_FILE = "claude-code-processor-ultimate.yml"

[[kv_namespaces]]
binding = "THREAD_CACHE"
id = "your-kv-id-here"
```

### 2.4 Add Cloudflare Secrets

```bash
wrangler secret put SLACK_SIGNING_SECRET
# Enter your Slack signing secret

wrangler secret put SLACK_BOT_TOKEN
# Enter your Slack bot token

wrangler secret put GITHUB_TOKEN
# Enter your GitHub token
```

### 2.5 Deploy Worker

```bash
npm run deploy
```

Note the URL: `https://claude-slack-bot.youraccount.workers.dev`

## Step 3: Slack App Configuration

### 3.1 Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: "Claude" (or your preference)
4. Select your workspace

### 3.2 Configure OAuth & Permissions

Add these Bot Token Scopes:
- `app_mentions:read`
- `chat:write`
- `users:read`
- `chat:write.public` (optional)

Install to workspace and copy the Bot User OAuth Token.

### 3.3 Enable Event Subscriptions

1. Enable Events
2. Request URL: `https://your-worker.workers.dev/slack/events`
3. Subscribe to bot events:
   - `app_mention`
4. Save changes

### 3.4 Get Credentials

From Basic Information:
- Copy **Signing Secret** → `SLACK_SIGNING_SECRET`
- Copy **Team ID** → `SLACK_TEAM_ID`

## Step 4: Notion Setup

### 4.1 Create Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create new integration named "Claude Code"
3. Copy the Internal Integration Token

### 4.2 Create Parent Page

1. Create a page called "Claude Code" in Notion
2. Click "..." → "Add connections" → Select "Claude Code"
3. This page will store all Q&A sessions

## Step 5: Final Deployment

### 5.1 Deploy Everything

```bash
# Verify configuration
./verify-deployment.sh

# Deploy to Cloudflare
npm run deploy

# Monitor logs
wrangler tail
```

### 5.2 Test the Bot

1. Invite bot to a channel: `/invite @claude`
2. Test basic functionality: `@claude hello`
3. Check Notion for saved Q&A

## Troubleshooting

### Worker Not Responding

```bash
# Check logs
wrangler tail

# Common issues:
# - Wrong signing secret
# - Bot not invited to channel
# - Event URL not verified
```

### GitHub Action Failing

Check:
- All secrets are set correctly
- Workflow file name matches wrangler.toml
- GitHub token has correct permissions

### Notion Not Saving

Verify:
- Notion integration has access to "Claude Code" page
- API key starts with `secret_`
- Page exists and is shared with integration

## Monitoring

### Real-time Logs

```bash
wrangler tail
```

### GitHub Actions

Monitor at: `github.com/yourusername/repo/actions`

### Slack Activity

Use Slack's app management to view:
- Message counts
- Error rates
- Usage statistics

## Updating

### Code Updates

```bash
git pull
npm install
npm run deploy
```

### Configuration Changes

1. Update `wrangler.toml`
2. Redeploy: `npm run deploy`

### Workflow Updates

1. Edit `.github/workflows/claude-code-processor-ultimate.yml`
2. Commit and push
3. Worker will use new workflow automatically

## Security Best Practices

1. **Rotate secrets regularly**
2. **Limit bot permissions** to necessary channels
3. **Monitor usage** for unusual patterns
4. **Keep dependencies updated**: `npm update`

## Performance Optimization

1. **Use KV caching** for frequently accessed data
2. **Monitor GitHub Actions usage** to stay within limits
3. **Configure appropriate timeouts** in workflow
4. **Use model selection** to balance cost/performance

---

Need help? Check the [Troubleshooting Guide](maintenance.md) or open an issue.