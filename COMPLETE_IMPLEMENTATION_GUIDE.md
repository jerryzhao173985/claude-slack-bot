# 🚀 Claude Slack Bot - Complete Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
3. [Implementation Details](#implementation-details)
4. [Code Snippets & Examples](#code-snippets--examples)
5. [Configuration Reference](#configuration-reference)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

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
- **Cloudflare Workers**: <3s response time for Slack events
- **GitHub Actions**: Long-running environment for Claude + MCP
- **MCP Servers**: Official integrations without custom code
- **KV Storage**: Thread context caching

---

## Core Features

### 1. 🧠 Smart Model Selection
Choose between three Claude models with different capabilities:

```slack
@claude /model advanced analyze this architecture
@claude using sonnet-3.5 quick calculation
@claude with model 4 write comprehensive docs
```

**Implementation in `eventHandler.ts`:**
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
  // ... other patterns
}
```

### 2. 💭 Thinking Mode
Automatically enabled for supported models:

| Model | Thinking Mode | Visual Indicator |
|-------|--------------|------------------|
| Sonnet 4 | ✅ Enabled | 🧠 |
| Sonnet 3.7 | ✅ Enabled | 🧠 |
| Sonnet 3.5 | ❌ Disabled | - |

**Configuration in workflow:**
```yaml
- name: Configure Claude settings
  run: |
    if [[ "${{ github.event.inputs.model }}" == "claude-3-5-sonnet-20241022" ]]; then
      echo "CLAUDE_CODE_THINKING=false" >> $GITHUB_OUTPUT
    else
      echo "CLAUDE_CODE_THINKING=true" >> $GITHUB_OUTPUT
    fi
```

### 3. 📝 Notion Integration
Every Q&A is automatically saved to Notion with proper formatting:

**Fixed Implementation (Single API Call):**
```json
{
  "parent": { "page_id": "<CLAUDE_CODE_PAGE_ID>" },
  "properties": {
    "title": { "title": [{ "text": { "content": "Clean Title" } }] }
  },
  "children": [
    { "heading_1": { "rich_text": [{ "text": { "content": "Title" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Question" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "User's question" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Answer" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "Claude's response" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Metadata" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Timestamp" } }] } }
  ]
}
```

### 4. 🧵 Thread Context Awareness
Automatically reads up to 50 previous messages:

**Thread Context Building:**
```typescript
async getThreadContext(channel: string, thread_ts: string): Promise<SlackMessage[]> {
  // Check cache first
  const cacheKey = `thread_${channel}_${thread_ts}`;
  const cached = await this.env.THREAD_CACHE.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from Slack API
  const messages = await this.fetchThreadMessages(channel, thread_ts);
  
  // Cache for 5 minutes
  await this.env.THREAD_CACHE.put(cacheKey, JSON.stringify(messages), {
    expirationTtl: 300
  });
  
  return messages;
}
```

### 5. 🔧 MCP Tool Integration
Three MCP servers configured:

**MCP Configuration:**
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

## Implementation Details

### 1. Slack Event Handler
**Location:** `src/routes/slack.ts`

```typescript
post: route({
  request: {
    body: z.object({
      event: z.object({
        type: z.string(),
        text: z.string().optional(),
        user: z.string().optional(),
        ts: z.string().optional(),
        thread_ts: z.string().optional(),
        channel: z.string().optional(),
      }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Event processed',
    },
  },
}).handler(async (c) => {
  const { event } = c.req.valid('json');
  
  if (event.type === 'app_mention') {
    const handler = new EventHandler(c.env);
    await handler.handleMention(event);
  }
  
  return c.json({ ok: true });
});
```

### 2. GitHub Workflow Dispatcher
**Location:** `src/services/githubDispatcher.ts`

```typescript
async dispatchWorkflow(inputs: GitHubWorkflowInputs): Promise<void> {
  const url = `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/actions/workflows/${this.env.GITHUB_WORKFLOW_FILE}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        question: inputs.question,
        slack_channel: inputs.slack_channel,
        slack_ts: inputs.slack_ts,
        slack_thread_ts: inputs.slack_thread_ts || '',
        system_prompt: inputs.system_prompt,
        model: inputs.model || '',
      },
    }),
  });
}
```

### 3. Claude Workflow Configuration
**Location:** `.github/workflows/claude-code-processor.yml`

Key configurations:
```yaml
- name: Process with Claude
  uses: anthropics/claude-code-base-action@beta
  with:
    prompt: |
      # Structured prompt with Notion saving first
      # Then Slack reply
      # Thread context awareness
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    anthropic_model: ${{ github.event.inputs.model }}
    allowed_tools: |
      mcp__slack__slack_reply_to_thread,
      mcp__notionApi__API-post-search,
      mcp__notionApi__API-post-page,
      Write,Read,Bash,WebSearch
    claude_env: |
      ANTHROPIC_PROMPT_CACHING=1
      CLAUDE_CODE_AUTORUN_TOOLS=true
      CLAUDE_CODE_THINKING=$THINKING
      CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

### 4. Permission Handling
**Critical Fix:** Using environment variable to skip MCP permissions:

```yaml
claude_env: |
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

This prevents the "permission not granted" errors in non-interactive GitHub Actions.

---

## Code Snippets & Examples

### 1. Model Selection Examples
```typescript
// Auto-selection for complex tasks
const COMPLEX_KEYWORDS = [
  'comprehensive', 'detailed', 'analyze', 'analysis',
  'in-depth', 'thorough', 'extensive', 'complete'
];

const hasComplexKeywords = COMPLEX_KEYWORDS.some(keyword => 
  lowerText.includes(keyword)
);

if (hasComplexKeywords) {
  return 'claude-sonnet-4-20250514'; // Auto-select advanced model
}
```

### 2. Title Generation for Notion
```typescript
// Clean title generation rules
function generateCleanTitle(question: string): string {
  // Remove @ mentions
  let title = question.replace(/@\w+/g, '').trim();
  
  // Remove special characters
  title = title.replace(/[^\w\s-]/g, '');
  
  // Truncate to 50 chars
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  // Title case
  return title.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
```

### 3. Thread Context Formatting
```typescript
buildSystemPrompt(context: SlackMessage[]): string {
  const sortedContext = [...context].sort((a, b) => 
    Number(a.ts) - Number(b.ts)
  );
  
  const threadHistory = sortedContext.map((msg, index) => {
    const time = formatTimestamp(msg.ts);
    const userLabel = msg.isBot ? `${msg.user} (bot)` : msg.user;
    const prefix = index === sortedContext.length - 1 ? '➤' : '•';
    
    return `${prefix} [${time}] ${userLabel}: ${msg.text}`;
  }).join('\n');
  
  return `SLACK THREAD CONTEXT:\n${threadHistory}`;
}
```

### 4. Placeholder Message with Model Info
```typescript
const modelInfo = model.includes('4') ? 'Sonnet 4 🧠' : 
                  model.includes('3.7') ? 'Sonnet 3.7 🧠' :
                  'Sonnet 3.5';

const placeholderText = `:thinking_face: Working on your request (using ${modelInfo})...`;
```

---

## Configuration Reference

### 1. Wrangler Configuration
```toml
name = "claude-slack-bot"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "THREAD_CACHE"
id = "your-kv-namespace-id"

[vars]
GITHUB_OWNER = "your-username"
GITHUB_REPO = "claude-slack-bot"
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"
```

### 2. Required Secrets

**GitHub Repository:**
```
ANTHROPIC_API_KEY    # Claude API key
SLACK_BOT_TOKEN      # xoxb-...
SLACK_TEAM_ID        # T0123456789
NOTION_KEY           # secret_...
GH_TOKEN             # ghp_...
```

**Cloudflare Worker:**
```
SLACK_SIGNING_SECRET # From Slack app
SLACK_BOT_TOKEN      # Same as GitHub
GITHUB_TOKEN         # For workflow dispatch
```

### 3. Slack App Configuration
- **Event Subscriptions**: `app_mention`
- **OAuth Scopes**: 
  - `app_mentions:read`
  - `chat:write`
  - `users:read`
  - `chat:write.public` (optional)

---

## Deployment Guide

### 1. Pre-deployment Verification
```bash
./verify-deployment.sh
```

### 2. Deploy Sequence
```bash
# 1. Push code changes
git push

# 2. Deploy Worker (CRITICAL after config changes!)
npm run deploy

# 3. Monitor deployment
wrangler tail
```

### 3. Test Deployment
```slack
@claude hello world                    # Basic test
@claude test notion integration        # Notion test
@claude summarize this thread         # Thread context test
@claude /model advanced analyze data  # Model selection test
```

---

## Troubleshooting

### 1. Workflow Not Triggering
**Issue**: GitHub Action not starting
**Fix**: 
```bash
# Ensure Worker is deployed with latest config
npm run deploy
# Check workflow name matches
grep GITHUB_WORKFLOW_FILE wrangler.toml
```

### 2. Notion Pages Without Content
**Issue**: Pages created but empty
**Fix**: Implemented single API call with `children` array

### 3. Permission Errors
**Issue**: "Claude requested permissions to use..."
**Fix**: Added `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true`

### 4. Model Selection Issues
**Issue**: Wrong model being used
**Fix**: Check `detectModelPreference` logic and patterns

### 5. Thread Context Missing
**Issue**: Claude doesn't see thread history
**Fix**: Verify KV namespace is configured and accessible

---

## Important Implementation Notes

### 1. Deployment After Config Changes
**CRITICAL**: Always run `npm run deploy` after changing:
- Workflow file names
- Environment variables in wrangler.toml
- Any configuration values

### 2. Notion Content Structure
Must include all content in initial `API-post-page` call:
- Use proper block structure with `object` and `type`
- Include all blocks in `children` array
- Don't use separate patch operations

### 3. Error Handling Flow
1. Worker posts placeholder immediately
2. If MCP fails, fallback Slack update runs
3. Response saved to `outputs/slack_response.txt`

### 4. Performance Optimizations
- Thread context cached for 5 minutes
- Prompt caching enabled
- Model-specific thinking mode
- Minimal tool list for faster execution

---

## Feature Summary

✅ **Multi-model support** with smart selection
✅ **Thinking mode** for advanced models
✅ **Notion integration** with full content
✅ **Thread context** awareness
✅ **MCP tools** (Slack, Notion, GitHub)
✅ **Error resilience** with fallbacks
✅ **Performance optimized** with caching

This implementation provides a production-ready Slack bot that leverages Claude's capabilities through a distributed architecture, ensuring reliability, scalability, and feature richness.