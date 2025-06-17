# 📚 Claude Slack Bot - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Features](#features)
4. [Implementation History](#implementation-history)
5. [Critical Bug Fix Documentation](#critical-bug-fix-documentation)
6. [Configuration & Secrets](#configuration--secrets)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)
9. [Code Examples](#code-examples)
10. [Lessons Learned](#lessons-learned)

---

## Project Overview

**Claude Slack Bot** is a distributed Slack bot that leverages Claude AI through GitHub Actions, providing intelligent responses with automatic documentation in Notion. The bot uses a serverless architecture split between Cloudflare Workers (for fast Slack event handling) and GitHub Actions (for running Claude with MCP servers).

### Key Capabilities
- 🤖 Multi-model Claude support (Sonnet 3.5, 3.7, and 4)
- 💭 Thinking mode for advanced models
- 📝 Automatic Q&A documentation in Notion
- 🧵 Thread context awareness
- 🔧 MCP tool integration (Slack, Notion, GitHub)
- ⚡ <3s Slack response time
- 🔄 Zero infrastructure maintenance

---

## Architecture & Design

### Distributed Architecture
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

1. **Cloudflare Workers**: 
   - Handles Slack's 3-second response requirement
   - Posts immediate placeholder message
   - Minimal bundle size (<1MB limit)
   - Global edge deployment

2. **GitHub Actions**: 
   - Runs Claude Code with MCP servers
   - Supports long-running operations (up to 10 minutes)
   - No infrastructure to manage
   - Free tier includes 2,000 minutes/month

3. **MCP Servers**: 
   - Official integrations without custom code
   - Direct API access to Slack, Notion, and GitHub
   - Maintained by Anthropic and partners

---

## Features

### 1. 🧠 Smart Model Selection

Users can choose between three Claude models:

```slack
@claude /model advanced analyze this architecture
@claude using sonnet-3.5 quick calculation
@claude with model 4 write comprehensive docs
```

**Model Capabilities:**
| Model | Version | Thinking Mode | Best For |
|-------|---------|--------------|----------|
| Sonnet 4 | claude-sonnet-4-20250514 | ✅ Enabled | Complex analysis, deep thinking |
| Sonnet 3.7 | claude-3-7-sonnet-20250219 | ✅ Enabled | Latest features, balanced |
| Sonnet 3.5 | claude-3-5-sonnet-20241022 | ❌ Disabled | Fast responses, simple tasks |

**Implementation (eventHandler.ts):**
```typescript
detectModelPreference(text: string): string | null {
  // Slash command patterns
  const slashCommandMatch = text.match(/\/(?:model|mode)\s+(\w+)/i);
  if (slashCommandMatch) {
    const preset = slashCommandMatch[1].toLowerCase();
    const presetMap: Record<string, string> = {
      'advanced': 'claude-sonnet-4-20250514',
      'smart': 'claude-sonnet-4-20250514',
      'deep': 'claude-sonnet-4-20250514',
      'fast': 'claude-3-5-sonnet-20241022',
      'balanced': 'claude-3-5-sonnet-20241022',
      'quick': 'claude-3-5-sonnet-20241022',
      'latest': 'claude-3-7-sonnet-20250219',
      'newest': 'claude-3-7-sonnet-20250219',
    };
    return presetMap[preset] || null;
  }
  
  // Natural language patterns
  const patterns = [
    { regex: /(?:using|with|via)\s+(?:model\s+)?sonnet[- ]?3\.5/i, model: 'claude-3-5-sonnet-20241022' },
    { regex: /(?:using|with|via)\s+(?:model\s+)?sonnet[- ]?3\.7/i, model: 'claude-3-7-sonnet-20250219' },
    { regex: /(?:using|with|via)\s+(?:model\s+)?(?:sonnet[- ]?)?4(?:\.0)?/i, model: 'claude-sonnet-4-20250514' },
  ];
  
  // Auto-selection for complex tasks
  const COMPLEX_KEYWORDS = ['comprehensive', 'detailed', 'analyze', 'analysis', 'in-depth'];
  const hasComplexKeywords = COMPLEX_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword));
  
  if (hasComplexKeywords) {
    return 'claude-sonnet-4-20250514';
  }
}
```

### 2. 💭 Thinking Mode

Automatically enabled for supported models:

**Workflow Configuration:**
```yaml
- name: Configure Claude settings
  run: |
    if [[ "${{ github.event.inputs.model }}" == "claude-3-5-sonnet-20241022" ]]; then
      echo "CLAUDE_CODE_THINKING=false" >> $GITHUB_OUTPUT
    else
      echo "CLAUDE_CODE_THINKING=true" >> $GITHUB_OUTPUT
    fi
```

**Visual Indicators:**
- Sonnet 4: "Working on your request (using Sonnet 4 🧠)..."
- Sonnet 3.7: "Working on your request (using Sonnet 3.7 🧠)..."
- Sonnet 3.5: "Working on your request (using Sonnet 3.5)..."

### 3. 📝 Notion Integration

Every Q&A session is automatically saved to Notion with proper formatting.

**Fixed Implementation (Single API Call):**
```json
{
  "parent": { "page_id": "21419c81-3358-8023-8719-f0102f427d8d" },
  "properties": {
    "title": { "title": [{ "text": { "content": "Clean Title (max 50 chars)" } }] }
  },
  "children": [
    { "heading_1": { "rich_text": [{ "text": { "content": "Title" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Question" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "User's question" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Answer" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "Claude's response" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Metadata" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Timestamp" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Channel" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Model" } }] } }
  ]
}
```

**Important:** All content must be included in the `children` array during page creation. Separate patch operations are not supported due to permission constraints.

### 4. 🧵 Thread Context Awareness

The bot automatically reads up to 50 previous messages in a thread:

**Implementation (slackClient.ts):**
```typescript
async getThreadContext(channel: string, thread_ts: string): Promise<SlackMessage[]> {
  // Check cache first
  const cacheKey = `thread_${channel}_${thread_ts}`;
  const cached = await this.env.THREAD_CACHE.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from Slack API
  const response = await fetch(
    `https://slack.com/api/conversations.replies?channel=${channel}&ts=${thread_ts}&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  const messages = await this.enrichMessagesWithUserInfo(data.messages);
  
  // Cache for 5 minutes
  await this.env.THREAD_CACHE.put(cacheKey, JSON.stringify(messages), {
    expirationTtl: 300
  });
  
  return messages;
}
```

**System Prompt Building:**
```typescript
buildSystemPrompt(context: SlackMessage[]): string {
  const sortedContext = [...context].sort((a, b) => Number(a.ts) - Number(b.ts));
  
  const threadHistory = sortedContext.map((msg, index) => {
    const time = formatTimestamp(msg.ts);
    const userLabel = msg.isBot ? `${msg.user} (bot)` : msg.user;
    const prefix = index === sortedContext.length - 1 ? '➤' : '•';
    
    return `${prefix} [${time}] ${userLabel}: ${msg.text}`;
  }).join('\n');

  return `SLACK THREAD CONTEXT:
This is a Slack thread with ${context.length} messages.
${threadHistory}

The message marked with ➤ is the most recent one that you're responding to.`;
}
```

### 5. 🔧 MCP Tool Integration

Three MCP servers are configured:

**MCP Configuration (inline in workflow):**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": { 
        "SLACK_BOT_TOKEN": "${{ secrets.SLACK_BOT_TOKEN }}",
        "SLACK_TEAM_ID": "${{ secrets.SLACK_TEAM_ID }}" 
      }
    },
    "notionApi": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { 
        "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer ${{ secrets.NOTION_KEY }}\",\"Notion-Version\":\"2022-06-28\"}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { 
        "GITHUB_TOKEN": "${{ secrets.GH_TOKEN }}" 
      }
    }
  }
}
```

---

## Implementation History

### Phase 1: Initial Implementation
- Basic Cloudflare Worker for Slack events
- GitHub Actions workflow with Claude Code
- Simple MCP configuration using external script

### Phase 2: Feature Enhancements
- Added model selection support
- Implemented thread context awareness
- Enhanced error handling and logging
- Performance optimizations with caching

### Phase 3: Ultimate Version Development
- Consolidated multiple test workflows
- Added thinking mode support
- Improved Notion integration
- **Critical Issue:** Removed `mcp_tools` parameter

### Phase 4: Bug Discovery & Fix
- Discovered workflow dispatch failing with 422 error
- Identified missing `mcp_tools` parameter
- Fixed and tested successfully

---

## Critical Bug Fix Documentation

### The Missing `mcp_tools` Parameter Issue

#### Timeline of Events

1. **Original Implementation (✅ Working)**
   - File: `claude-code-processor.yml`
   - Had `mcp_tools` input parameter
   - Worker dispatch successful

2. **Ultimate Version Creation (⚠️ Bug Introduced)**
   - File: `claude-code-processor-ultimate.yml`
   - Missing `mcp_tools` parameter
   - Worker still sending it, causing silent failures

3. **Cleanup Refactoring (❌ Bug Manifested)**
   - Renamed back to `claude-code-processor.yml`
   - Copied content from ultimate (without `mcp_tools`)
   - GitHub API started returning 422 errors

#### Root Cause Analysis

**Worker Always Sends:**
```typescript
await this.githubDispatcher.dispatchWorkflow({
  question,
  mcp_tools: tools.join(','),  // ALWAYS SENT
  slack_channel: channel,
  slack_ts: placeholder.ts,
  slack_thread_ts: thread_ts || ts,
  system_prompt: this.githubDispatcher.buildSystemPrompt(context),
  model,
});
```

**Workflow Was Missing:**
```yaml
# Before fix - MISSING mcp_tools
inputs:
  question:
  slack_channel:
  slack_ts:
  slack_thread_ts:
  system_prompt:
  model:
  # mcp_tools was NOT defined!
```

**GitHub API Response:**
```json
{
  "message": "Unexpected inputs provided: [\"mcp_tools\"]",
  "documentation_url": "https://docs.github.com/rest/actions/workflows",
  "status": "422"
}
```

#### The Fix

Added the missing parameter to workflow:
```yaml
mcp_tools:
  description: "Comma-separated list of MCP tools"
  required: false
  type: string
```

#### Lessons Learned

1. **API Contracts Matter**: When a client sends parameters, the server must accept them
2. **Silent Failures Hide Issues**: The bot appeared to work but was failing in the background
3. **Cleanup Can Break Things**: Removing "unnecessary" code without understanding its purpose
4. **Test After Refactoring**: Always verify functionality after major changes

---

## Configuration & Secrets

### Environment Variables (wrangler.toml)
```toml
[vars]
GITHUB_OWNER = "jerryzhao173985"
GITHUB_REPO = "claude-slack-bot"
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"
```

### Required Secrets

**Cloudflare Worker:**
- `SLACK_SIGNING_SECRET` - For verifying Slack requests
- `SLACK_BOT_TOKEN` - For Slack API calls
- `GITHUB_TOKEN` - For triggering workflows

**GitHub Repository:**
- `ANTHROPIC_API_KEY` - Claude API access
- `SLACK_BOT_TOKEN` - Same as Worker
- `SLACK_TEAM_ID` - Slack workspace ID
- `NOTION_KEY` - Notion integration token
- `GH_TOKEN` - GitHub API access

### Slack App Configuration
- Event Subscriptions: `app_mention`
- OAuth Scopes:
  - `app_mentions:read`
  - `chat:write`
  - `users:read`
  - `chat:write.public` (optional)

---

## Deployment Guide

### Prerequisites
1. Slack App created with proper permissions
2. Notion integration configured
3. GitHub repository with Actions enabled
4. Cloudflare account for Workers

### Step-by-Step Deployment

1. **Clone and Configure:**
   ```bash
   git clone https://github.com/jerryzhao173985/claude-slack-bot
   cd claude-slack-bot
   cp wrangler.toml.example wrangler.toml
   # Edit wrangler.toml with your values
   ```

2. **Set Cloudflare Secrets:**
   ```bash
   wrangler secret put SLACK_SIGNING_SECRET
   wrangler secret put SLACK_BOT_TOKEN
   wrangler secret put GITHUB_TOKEN
   ```

3. **Set GitHub Secrets:**
   - Go to Settings → Secrets → Actions
   - Add all required secrets

4. **Deploy Worker:**
   ```bash
   npm install
   npm run deploy
   ```

5. **Configure Slack App:**
   - Event Subscriptions URL: `https://your-worker.workers.dev/slack/events`
   - Install app to workspace

### Critical: After Configuration Changes

**ALWAYS redeploy the Worker after changing:**
- Workflow file names
- Environment variables
- Any configuration in wrangler.toml

```bash
npm run deploy
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Workflow Not Triggering
**Symptoms:** Bot responds in Slack but no GitHub Action runs

**Causes & Fixes:**
- Missing `GITHUB_TOKEN` in Worker secrets
- Wrong workflow filename in `wrangler.toml`
- Worker not redeployed after config change

**Debug Commands:**
```bash
# Check Worker secrets
wrangler secret list

# Check deployment
wrangler deployments list

# Monitor logs
wrangler tail
```

#### 2. Notion Pages Without Content
**Symptoms:** Pages created but only show title

**Cause:** Using separate API calls for content
**Fix:** Include all content in `children` array during creation

#### 3. Permission Errors
**Symptoms:** "Claude requested permissions to use..."

**Fix:** Set environment variable:
```yaml
CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

#### 4. Model Selection Not Working
**Symptoms:** Always uses default model

**Check:** Model detection patterns in `eventHandler.ts`

### Debug Endpoints

The Worker includes debug endpoints:
- `/debug/config` - Check configuration
- `/debug/test-dispatch` - Test workflow dispatch

---

## Code Examples

### Triggering the Bot

**Basic Usage:**
```slack
@claude hello world
```

**Model Selection:**
```slack
@claude /model advanced analyze this codebase
@claude using sonnet-3.5 what's the weather?
@claude with model 4 write unit tests
```

**Thread Context:**
```slack
@claude summarize this thread
@claude based on the discussion above, create a plan
```

### Extending the Bot

**Adding a New MCP Server:**
```json
"newServer": {
  "command": "npx",
  "args": ["-y", "@package/mcp-server"],
  "env": { 
    "API_KEY": "${{ secrets.NEW_API_KEY }}"
  }
}
```

**Adding Custom Model Aliases:**
```typescript
const presetMap: Record<string, string> = {
  'genius': 'claude-sonnet-4-20250514',
  'swift': 'claude-3-5-sonnet-20241022',
  // Add your aliases here
};
```

---

## Lessons Learned

### Technical Insights

1. **Distributed Architecture Benefits:**
   - Separation of concerns (fast response vs. processing)
   - Leveraging platform strengths (edge vs. compute)
   - Cost optimization (free tiers)

2. **MCP Integration Patterns:**
   - Single API calls are more reliable than multi-step
   - Permission modes affect non-interactive environments
   - Official servers reduce maintenance burden

3. **Error Handling Importance:**
   - Explicit error messages save debugging time
   - Fallback mechanisms ensure reliability
   - Logging at every step helps troubleshooting

### Process Improvements

1. **Documentation First:**
   - Document while building, not after
   - Include the "why" not just the "what"
   - Keep troubleshooting guides updated

2. **Testing Strategy:**
   - Test configuration changes immediately
   - Use debug endpoints for verification
   - Monitor logs during deployment

3. **Refactoring Discipline:**
   - Understand code before removing it
   - Preserve API contracts
   - Test thoroughly after changes

---

## Future Enhancements

### Potential Features
- [ ] Support for more MCP servers (Google Drive, etc.)
- [ ] Custom model fine-tuning integration
- [ ] Analytics dashboard for usage tracking
- [ ] Multi-workspace support
- [ ] Scheduled tasks and reminders

### Architecture Improvements
- [ ] Response streaming for long outputs
- [ ] Webhook reliability with retry logic
- [ ] Enhanced caching strategies
- [ ] Monitoring and alerting

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/jerryzhao173985/claude-slack-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jerryzhao173985/claude-slack-bot/discussions)
- **Slack Community**: Coming soon

---

*This documentation represents the complete implementation of the Claude Slack Bot as of June 2025, including all features, fixes, and lessons learned during development.*