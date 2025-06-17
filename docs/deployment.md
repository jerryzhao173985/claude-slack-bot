# 🚀 Complete Deployment Guide - Claude Slack Bot

This comprehensive guide covers everything you need to deploy the Claude Slack Bot successfully.

## Table of Contents
1. [Quick Deploy Checklist](#quick-deploy-checklist)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Verification & Testing](#verification--testing)
5. [Common Deployment Issues](#common-deployment-issues)
6. [Production Best Practices](#production-best-practices)
7. [Rollback Procedures](#rollback-procedures)

---

## Quick Deploy Checklist

⚡ **For experienced users - complete checklist:**

```bash
# Pre-flight check
./verify-deployment.sh

# Configuration checklist
- [ ] Slack App created with correct scopes
- [ ] Notion integration configured
- [ ] GitHub PAT with repo + workflow scopes
- [ ] All secrets added to GitHub repo
- [ ] Cloudflare account ready
- [ ] wrangler.toml configured
- [ ] KV namespace created
- [ ] Worker secrets set

# Deploy command sequence
git push && npm run deploy && wrangler tail

# Verify deployment
@claude hello world
```

---

## Prerequisites

### Required Accounts & Access
- ✅ **Slack Workspace** with admin access
- ✅ **GitHub Account** with repository creation
- ✅ **Cloudflare Account** (free tier works)
- ✅ **Notion Account** with integration capability
- ✅ **Anthropic API Key** for Claude

### Local Development Environment
```bash
# Check requirements
node --version  # Should be 18+
npm --version   # Should be 8+
git --version   # Any recent version

# Install Cloudflare Wrangler globally
npm install -g wrangler
```

### Pre-deployment Verification
Run the verification script to ensure everything is ready:
```bash
./verify-deployment.sh
```

This checks:
- Prerequisites (Node.js, npm, wrangler)
- Project structure integrity
- Configuration files validity
- Build process functionality
- TypeScript compliance

---

## Step-by-Step Deployment

### Step 1: Repository Setup

#### 1.1 Fork or Clone
```bash
# Option 1: Fork via GitHub UI (recommended)
# Then clone your fork:
git clone https://github.com/YOUR_USERNAME/claude-slack-bot.git
cd claude-slack-bot

# Option 2: Direct clone
git clone https://github.com/jerryzhao173985/claude-slack-bot.git
cd claude-slack-bot
git remote set-url origin https://github.com/YOUR_USERNAME/claude-slack-bot.git
```

#### 1.2 Install Dependencies
```bash
npm install
```

#### 1.3 Add GitHub Secrets

In your repository → Settings → Secrets and variables → Actions:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API key |
| `SLACK_BOT_TOKEN` | `xoxb-...` | From Slack OAuth |
| `SLACK_TEAM_ID` | `T1234567890` | Your workspace ID |
| `NOTION_KEY` | `secret_...` | Notion integration |
| `GH_TOKEN` | `ghp_...` | GitHub PAT |

---

### Step 2: Slack App Configuration

#### 2.1 Create Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. App Name: `Claude Code Bot` (or your preference)
4. Pick your workspace

#### 2.2 Configure OAuth & Permissions
Navigate to **OAuth & Permissions** and add these Bot Token Scopes:
- `app_mentions:read` - Read @mentions
- `chat:write` - Post messages
- `chat:write.public` - Post to any public channel
- `users:read` - Get user information
- `channels:history` - Read public channel history
- `groups:history` - Read private channel history

#### 2.3 Enable Event Subscriptions
1. Go to **Event Subscriptions**
2. Enable Events: **ON**
3. Request URL: `https://YOUR-WORKER.workers.dev/slack/events`
   - You'll update this after deploying the Worker
4. Subscribe to bot events:
   - `app_mention` - When someone @mentions your bot

#### 2.4 Install App to Workspace
1. Go to **Install App**
2. Click **"Install to Workspace"**
3. Review and authorize permissions

#### 2.5 Collect Slack Credentials
Save these values - you'll need them soon:

From **Basic Information**:
```
Signing Secret → SLACK_SIGNING_SECRET
```

From **OAuth & Permissions**:
```
Bot User OAuth Token → SLACK_BOT_TOKEN (starts with xoxb-)
```

From your Slack URL:
```
https://app.slack.com/client/T1234567890/...
                            ^^^^^^^^^^^
Team ID → SLACK_TEAM_ID
```

---

### Step 3: Notion Integration Setup

#### 3.1 Create Notion Integration
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Configure:
   - Name: `Claude Code Bot`
   - Associated workspace: Your workspace
   - Capabilities:
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content

#### 3.2 Get Integration Token
Copy the **Internal Integration Token**:
```
secret_XXXXXXXXXXXXX → NOTION_KEY
```

#### 3.3 Create and Share Claude Code Page
1. Create a new page in Notion titled **"Claude Code"**
2. Share with integration:
   - Click **"..."** menu → **"Add connections"**
   - Select your integration
3. Get page ID from URL:
```
https://notion.so/Claude-Code-21419c81335880238719f0102f427d8d
                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                              This is your page ID
```

---

### Step 4: GitHub Configuration

#### 4.1 Create Personal Access Token
1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. **"Generate new token (classic)"**
4. Configure:
   - Note: `Claude Slack Bot`
   - Expiration: 90 days (or your preference)
   - Scopes:
     - ✅ `repo` (Full control)
     - ✅ `workflow` (Update workflows)
5. Generate and copy token:
```
ghp_XXXXXXXXXXXXX → GH_TOKEN
```

---

### Step 5: Cloudflare Worker Setup

#### 5.1 Configure Wrangler
```bash
# Copy example configuration
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

# KV namespace will be added after creation
```

#### 5.2 Create KV Namespace
```bash
# Create namespace
wrangler kv:namespace create "THREAD_CACHE"

# Output will show:
# binding = "THREAD_CACHE"
# id = "a1b2c3d4e5f6..."
```

Update `wrangler.toml` with the ID:
```toml
[[kv_namespaces]]
binding = "THREAD_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
```

#### 5.3 Set Worker Secrets
```bash
# Set each secret (you'll be prompted to enter the value)
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GITHUB_TOKEN
```

#### 5.4 Deploy Worker
```bash
npm run deploy
```

Output will show:
```
Published claude-slack-bot
https://claude-slack-bot.YOUR-SUBDOMAIN.workers.dev
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         Save this URL!
```

#### 5.5 Update Slack Event URL
1. Go back to Slack App → Event Subscriptions
2. Update Request URL with your Worker URL:
   ```
   https://claude-slack-bot.YOUR-SUBDOMAIN.workers.dev/slack/events
   ```
3. Wait for **"Verified"** ✅

---

### Step 6: Final Configuration

#### 6.1 Invite Bot to Channels
In Slack, for each channel where you want to use the bot:
```
/invite @claude
```

#### 6.2 Test Basic Functionality
```slack
@claude hello world
```

Expected behavior:
1. Immediate: "🤔 Working..." message
2. Within 30s: Actual response
3. Check GitHub Actions tab for running workflow

---

## Verification & Testing

### Basic Verification
```bash
# 1. Check Worker deployment
wrangler deployments list

# 2. Monitor logs
wrangler tail

# 3. In another terminal, test in Slack
@claude test deployment
```

### Debug Endpoints
Test configuration:
```bash
curl https://YOUR-WORKER.workers.dev/debug/config
```

Expected response:
```json
{
  "github": {
    "owner": "YOUR_USERNAME",
    "repo": "claude-slack-bot",
    "workflow_file": "claude-code-processor.yml",
    "token_set": true
  },
  "slack": {
    "bot_token_set": true,
    "signing_secret_set": true
  }
}
```

Test workflow dispatch:
```bash
curl https://YOUR-WORKER.workers.dev/debug/test-dispatch
```

### Full Feature Testing

1. **Model Selection**:
   ```slack
   @claude /model advanced analyze this
   @claude using sonnet-3.5 quick test
   @claude with model 4 complex task
   ```

2. **Notion Integration**:
   ```slack
   @claude test notion: save this Q&A
   ```
   - Check "Claude Code" page in Notion

3. **Thread Context**:
   ```slack
   User: Context message 1
   User: Context message 2
   User: @claude summarize this thread
   ```

### Verification Checklist
- [ ] Bot responds to mentions
- [ ] GitHub Actions triggered
- [ ] Notion pages created with content
- [ ] Model selection works
- [ ] Thread context recognized

---

## Common Deployment Issues

### Issue: "Working..." but No Response

**Cause**: GitHub workflow not triggering

**Solutions**:
1. Check `mcp_tools` parameter exists in workflow:
   ```yaml
   inputs:
     mcp_tools:
       description: "Comma-separated list of MCP tools"
       required: false
       type: string
   ```

2. Verify GITHUB_TOKEN is set:
   ```bash
   wrangler secret list  # Should show GITHUB_TOKEN
   ```

3. Check workflow name matches exactly:
   ```bash
   grep GITHUB_WORKFLOW_FILE wrangler.toml
   ls -la .github/workflows/
   ```

4. **CRITICAL**: Redeploy Worker after config changes:
   ```bash
   npm run deploy
   ```

### Issue: Notion Pages Empty

**Cause**: Content not included in initial creation

**Solution**: Ensure workflow includes all content in `children` array:
```json
{
  "parent": { "page_id": "..." },
  "properties": { "title": { ... } },
  "children": [
    // ALL content blocks here
  ]
}
```

### Issue: Permission Errors in Logs

**Cause**: MCP tools need auto-approval in CI

**Solution**: Workflow should have:
```yaml
claude_env: |
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

### Issue: Bot Not Responding at All

**Checks**:
1. Bot invited to channel: `/invite @claude`
2. Event URL verified in Slack app
3. Worker deployed successfully
4. Secrets set correctly

---

## Production Best Practices

### 1. Monitoring Setup
```bash
# Create monitoring script
cat > monitor-bot.sh << 'EOF'
#!/bin/bash
# Run health check every 5 minutes
while true; do
  curl -s https://YOUR-WORKER.workers.dev/health
  sleep 300
done
EOF
```

### 2. Backup Configuration
```bash
# Backup all configuration
mkdir -p backups/$(date +%Y%m%d)
cp wrangler.toml backups/$(date +%Y%m%d)/
cp .github/workflows/*.yml backups/$(date +%Y%m%d)/
echo "Backup created: backups/$(date +%Y%m%d)"
```

### 3. Security Best Practices
- Rotate tokens every 90 days
- Use least-privilege principle
- Monitor for unusual activity
- Keep dependencies updated:
  ```bash
  npm audit
  npm update
  ```

### 4. Performance Optimization
- Monitor KV storage usage
- Clear old thread cache periodically
- Track response times in logs

### 5. Update Strategy
1. Test changes in dev branch first
2. Deploy during low-usage hours
3. Monitor logs during deployment
4. Have rollback plan ready

---

## Rollback Procedures

### Quick Rollback
```bash
# 1. View deployment history
wrangler deployments list

# 2. Rollback Worker to previous version
wrangler rollback

# 3. Revert workflow if needed
git log -- .github/workflows/
git checkout PREVIOUS_COMMIT -- .github/workflows/claude-code-processor.yml
git commit -m "Rollback workflow to working version"
git push
```

### Full Recovery Process
1. **Stop current deployment**:
   ```bash
   wrangler delete
   ```

2. **Reset to known good state**:
   ```bash
   git checkout tags/v1.0.0  # Or known good commit
   ```

3. **Redeploy everything**:
   ```bash
   npm install
   npm run deploy
   ```

4. **Verify functionality**:
   ```bash
   ./verify-deployment.sh
   ```

---

## Critical Reminders

⚠️ **After ANY Configuration Change**:
1. Update `wrangler.toml`
2. Run `npm run deploy` 
3. Test in Slack
4. Monitor logs

⚠️ **The #1 Deployment Issue**:
Missing `mcp_tools` parameter in workflow - always verify it exists!

⚠️ **Configuration Sync**:
Worker configuration changes require redeployment - `npm run deploy`

---

## Support Resources

- **Logs**: `wrangler tail` for real-time debugging
- **Actions**: Check GitHub Actions tab for workflow runs
- **Debug**: Use `/debug/config` and `/debug/test-dispatch`
- **Issues**: [GitHub Issues](https://github.com/jerryzhao173985/claude-slack-bot/issues)

---

*Deployment typically takes 15-30 minutes. For additional help, see the [Troubleshooting Guide](TROUBLESHOOTING.md).*