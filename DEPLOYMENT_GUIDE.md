# 🚀 Claude Slack Bot - Complete Deployment Guide

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] **Slack Workspace** with admin access
- [ ] **GitHub Account** with repository creation rights
- [ ] **Cloudflare Account** (free tier is fine)
- [ ] **Notion Account** with integration capabilities
- [ ] **Anthropic API Key** for Claude access
- [ ] **Node.js 18+** installed locally
- [ ] **Git** installed and configured

---

## Step 1: Repository Setup

### 1.1 Fork or Clone the Repository

```bash
# Option 1: Fork (recommended)
# Go to https://github.com/jerryzhao173985/claude-slack-bot
# Click "Fork" button

# Option 2: Clone directly
git clone https://github.com/jerryzhao173985/claude-slack-bot.git
cd claude-slack-bot

# If forked, update remote
git remote set-url origin https://github.com/YOUR_USERNAME/claude-slack-bot.git
```

### 1.2 Install Dependencies

```bash
npm install
```

---

## Step 2: Slack App Configuration

### 2.1 Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name: `Claude Code Bot` (or your preference)
4. Pick workspace

### 2.2 Configure OAuth & Permissions

Navigate to **OAuth & Permissions** and add scopes:

**Bot Token Scopes:**
- `app_mentions:read` - Read mentions
- `chat:write` - Post messages
- `chat:write.public` - Post to public channels
- `users:read` - Get user info
- `channels:history` - Read channel history
- `groups:history` - Read private channel history

### 2.3 Enable Event Subscriptions

1. Go to **Event Subscriptions**
2. Toggle **"Enable Events"** ON
3. Request URL: `https://YOUR-WORKER.workers.dev/slack/events` (we'll get this URL later)
4. Subscribe to bot events:
   - `app_mention`

### 2.4 Install App to Workspace

1. Go to **Install App**
2. Click **"Install to Workspace"**
3. Authorize the permissions

### 2.5 Collect Slack Credentials

From **Basic Information**:
- `Signing Secret` → Save as `SLACK_SIGNING_SECRET`

From **OAuth & Permissions**:
- `Bot User OAuth Token` (starts with `xoxb-`) → Save as `SLACK_BOT_TOKEN`

Your Team ID (check URL: `https://app.slack.com/client/TXXXXXX/`):
- `TXXXXXX` → Save as `SLACK_TEAM_ID`

---

## Step 3: Notion Integration Setup

### 3.1 Create Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name: `Claude Code Bot`
4. Capabilities:
   - Read content ✅
   - Update content ✅
   - Insert content ✅

### 3.2 Get Integration Token

Copy the **Internal Integration Token** → Save as `NOTION_KEY`

### 3.3 Create Claude Code Page

1. Create a new page in Notion titled **"Claude Code"**
2. Share it with your integration:
   - Click **"..."** → **"Add connections"** → Select your integration
3. Copy the page ID from URL:
   ```
   https://www.notion.so/Claude-Code-21419c81335880238719f0102f427d8d
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   ```

---

## Step 4: GitHub Configuration

### 4.1 Create Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Scopes needed:
   - `repo` (Full control)
   - `workflow` (Update workflows)
4. Generate and copy → Save as `GH_TOKEN`

### 4.2 Add Repository Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `SLACK_BOT_TOKEN` - From Slack OAuth
- `SLACK_TEAM_ID` - Your Slack workspace ID
- `NOTION_KEY` - Notion integration token
- `GH_TOKEN` - GitHub personal access token

---

## Step 5: Cloudflare Worker Setup

### 5.1 Configure Wrangler

```bash
# Copy example config
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml
```

Update these values:
```toml
name = "claude-slack-bot"

[vars]
GITHUB_OWNER = "YOUR_GITHUB_USERNAME"
GITHUB_REPO = "claude-slack-bot"
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"

[[kv_namespaces]]
binding = "THREAD_CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # Create this in Cloudflare dashboard
```

### 5.2 Create KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create "THREAD_CACHE"

# Output will show:
# id = "xxxxxxxxxxxxx"
# Update this ID in wrangler.toml
```

### 5.3 Set Worker Secrets

```bash
# Set each secret when prompted
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GITHUB_TOKEN
```

### 5.4 Deploy Worker

```bash
npm run deploy
```

Output will show your Worker URL:
```
Published claude-slack-bot
https://claude-slack-bot.YOUR-SUBDOMAIN.workers.dev
```

### 5.5 Update Slack Event URL

1. Go back to Slack App → Event Subscriptions
2. Update Request URL: `https://claude-slack-bot.YOUR-SUBDOMAIN.workers.dev/slack/events`
3. It should show **"Verified"** ✅

---

## Step 6: Verification & Testing

### 6.1 Run Verification Script

```bash
# Create verification script
cat > verify-deployment.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying deployment..."

# Check Worker
echo "1. Worker URL:"
wrangler deployments list | grep https

# Check secrets
echo -e "\n2. Worker secrets:"
wrangler secret list

# Check workflow
echo -e "\n3. Workflow file:"
ls -la .github/workflows/

# Check configuration
echo -e "\n4. Configuration:"
grep -E "(GITHUB_OWNER|GITHUB_REPO|GITHUB_WORKFLOW_FILE)" wrangler.toml

echo -e "\n✅ If all above look correct, try: @claude hello"
EOF

chmod +x verify-deployment.sh
./verify-deployment.sh
```

### 6.2 Test Basic Functionality

1. **In Slack:**
   ```
   @claude hello world
   ```

2. **Expected behavior:**
   - Immediate: "🤔 Working..." reply
   - Within 30s: Actual response
   - Check GitHub Actions tab for running workflow

### 6.3 Test Debug Endpoints

```bash
# Test configuration
curl https://YOUR-WORKER.workers.dev/debug/config

# Test workflow dispatch
curl https://YOUR-WORKER.workers.dev/debug/test-dispatch
```

### 6.4 Monitor Logs

```bash
# Watch real-time logs
wrangler tail

# In another terminal, send a Slack message
# You should see the event being processed
```

---

## Step 7: Advanced Configuration

### 7.1 Model Selection Testing

```slack
@claude /model advanced analyze this deployment
@claude using sonnet-3.5 what's 2+2?
@claude with model 4 write a haiku
```

### 7.2 Notion Integration Testing

```slack
@claude test notion integration: save this Q&A
```

Check your Notion "Claude Code" page for the saved entry.

### 7.3 Thread Context Testing

```slack
User: First message
User: Second message
User: @claude summarize this thread
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All prerequisites installed
- [ ] Repository forked/cloned
- [ ] Dependencies installed (`npm install`)

### Slack Setup
- [ ] App created with correct scopes
- [ ] Event subscriptions configured
- [ ] App installed to workspace
- [ ] Credentials saved

### Notion Setup
- [ ] Integration created
- [ ] Claude Code page created and shared
- [ ] Token saved

### GitHub Setup
- [ ] PAT created with correct scopes
- [ ] All secrets added to repository

### Cloudflare Setup
- [ ] wrangler.toml configured
- [ ] KV namespace created
- [ ] Secrets added
- [ ] Worker deployed

### Verification
- [ ] Slack event URL verified
- [ ] Basic test message works
- [ ] GitHub Action triggered
- [ ] Notion page created

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. Check the last working deployment
wrangler deployments list

# 2. Rollback Worker if needed
wrangler rollback

# 3. Check workflow history
git log -- .github/workflows/

# 4. Restore working workflow
git checkout COMMIT_HASH -- .github/workflows/claude-code-processor.yml
git commit -m "Rollback to working workflow"
git push

# 5. Redeploy
npm run deploy
```

---

## Production Best Practices

### 1. Monitoring
```bash
# Set up automated monitoring
0 */6 * * * /path/to/test-bot-health.sh
```

### 2. Backup Configuration
```bash
# Backup all configuration
mkdir -p backups/$(date +%Y%m%d)
cp wrangler.toml backups/$(date +%Y%m%d)/
cp .github/workflows/*.yml backups/$(date +%Y%m%d)/
```

### 3. Update Strategy
- Test changes in a dev workspace first
- Deploy during low-usage hours
- Monitor logs during deployment
- Have rollback plan ready

### 4. Security
- Rotate tokens regularly
- Use least-privilege principle
- Monitor for unusual activity
- Keep dependencies updated

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| "Working..." but no response | Check GitHub Actions, redeploy Worker |
| 404 Workflow not found | Verify workflow name in wrangler.toml |
| Permission denied | Add `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true` |
| Notion pages empty | Check workflow has content in children array |
| Wrong model used | Verify model detection patterns |

---

## Support Resources

- **Documentation**: This guide + `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/jerryzhao173985/claude-slack-bot/issues)
- **Logs**: `wrangler tail` for real-time debugging
- **Debug**: `/debug/config` and `/debug/test-dispatch` endpoints

---

*Deployment typically takes 15-30 minutes. If you encounter issues, check the troubleshooting guide or create an issue.*