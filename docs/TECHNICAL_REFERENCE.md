# 🔧 Technical Reference - Claude Slack Bot

This document provides comprehensive technical details about the Claude Slack Bot implementation, architecture, and all features.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Details](#component-details)
3. [Feature Implementation](#feature-implementation)
4. [API Reference](#api-reference)
5. [Configuration Reference](#configuration-reference)
6. [MCP Integration](#mcp-integration)
7. [Security & Permissions](#security--permissions)
8. [Performance Optimization](#performance-optimization)
9. [Extension Points](#extension-points)

---

## Architecture Overview

### System Design

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    Slack    │────▶│ Cloudflare      │────▶│   GitHub     │
│   Events    │     │   Worker        │     │   Actions    │
└─────────────┘     └─────────────────┘     └──────────────┘
       ↓                    ↓                        ↓
   @mentions          Verify & Dispatch       Claude + MCP Tools
                      Post Placeholder         Update Message
```

### Key Design Decisions

1. **Split Architecture**: Cloudflare Worker handles time-sensitive Slack operations; GitHub Actions runs long-running Claude sessions
2. **MCP Integration**: Official MCP servers provide tool access without custom implementations
3. **Stateless Design**: No persistent infrastructure; uses KV for temporary caching
4. **Security First**: All requests verified; tokens never exposed in logs

---

## Component Details

### Cloudflare Worker (Edge Component)

**Purpose**: Handle Slack events within 3-second deadline

**Key Files**:
- `src/index.ts` - Hono app entry point
- `src/routes/slack.ts` - Slack event handling
- `src/middleware/verifySlack.ts` - Request verification
- `src/services/eventHandler.ts` - Event processing logic
- `src/services/githubDispatcher.ts` - Workflow dispatch

**Request Flow**:
```typescript
1. Receive Slack event → 2. Verify signature → 3. Post placeholder
→ 4. Fetch thread context → 5. Dispatch GitHub workflow → 6. Return 200 OK
```

### GitHub Actions (Runner Component)

**Purpose**: Execute Claude with MCP servers

**Workflow Structure**:
```yaml
name: Claude Code Processor
on:
  workflow_dispatch:
    inputs:
      question:         # User's question
      slack_channel:    # Where to respond
      slack_ts:        # Message to update
      slack_thread_ts: # Thread context
      system_prompt:   # Instructions
      model:          # Claude model
      mcp_tools:      # Enabled tools
```

**Execution Steps**:
1. Checkout repository
2. Prepare MCP configuration dynamically
3. Run claude-code-base-action@beta
4. Claude updates Slack message via MCP

---

## Feature Implementation

### 1. Model Selection

**Detection Pattern**:
```typescript
const patterns = [
  { regex: /\/model\s+(\w+)/, type: 'command' },
  { regex: /\busing\s+(?:model\s+)?([a-z0-9.-]+)\b/i, type: 'inline' },
  { regex: /\bwith\s+(?:model\s+)?([a-z0-9.-]+)\b/i, type: 'inline' }
];
```

**Model Mapping**:
```typescript
const models = {
  'sonnet': 'claude-3-5-sonnet-20241022',
  'sonnet-3.5': 'claude-3-5-sonnet-20241022',
  'sonnet-3.7': 'claude-3-5-sonnet-20250110',
  'sonnet-4': 'claude-4-5-sonnet-20250117',
  'haiku': 'claude-3-5-haiku-20241022',
  'advanced': 'claude-3-5-sonnet-20250110',
  '4': 'claude-4-5-sonnet-20250117'
};
```

**Thinking Mode**:
- Enabled for: sonnet-3.7, sonnet-4, advanced, 4
- Environment variable: `CLAUDE_CODE_THINKING=true`

### 2. Thread Context

**Implementation**:
```typescript
// Fetch thread messages
const messages = await slackClient.getThreadContext(channel, thread_ts);

// Cache in KV (60 min TTL)
await env.THREAD_CACHE.put(cacheKey, JSON.stringify(messages), {
  expirationTtl: 3600
});

// Build system prompt
const context = messages.map(m => 
  `${m.user || 'Bot'} [${new Date(m.ts * 1000).toISOString()}]: ${m.text}`
).join('\n');
```

### 3. Notion Integration

**Page Creation Structure**:
```json
{
  "parent": { "page_id": "CLAUDE_CODE_PAGE_ID" },
  "properties": {
    "title": { 
      "title": [{ "text": { "content": "Clean title (max 50 chars)" } }] 
    }
  },
  "children": [
    { "heading_1": { "rich_text": [{ "text": { "content": "Title" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Question" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "User question" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Answer" } }] } },
    { "paragraph": { "rich_text": [{ "text": { "content": "Claude response" } }] } },
    { "heading_2": { "rich_text": [{ "text": { "content": "Metadata" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Timestamp" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Channel" } }] } },
    { "bulleted_list_item": { "rich_text": [{ "text": { "content": "Model" } }] } }
  ]
}
```

### 4. Error Handling

**Worker Error Handling**:
```typescript
try {
  await githubDispatcher.dispatch(params);
} catch (error) {
  console.error('Dispatch failed:', error);
  await slackClient.postMessage({
    channel,
    text: '❌ Failed to process request. Please try again.',
    thread_ts
  });
}
```

**Workflow Error Handling**:
- Retry logic for transient failures
- Graceful degradation when MCP servers fail
- Always attempts to update Slack message

---

## API Reference

### Slack Event Payload

```typescript
interface SlackEvent {
  type: 'app_mention';
  text: string;
  user: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  event_ts: string;
}
```

### GitHub Workflow Dispatch

```typescript
interface WorkflowDispatch {
  ref: string;
  inputs: {
    question: string;
    slack_channel: string;
    slack_ts: string;
    slack_thread_ts?: string;
    system_prompt?: string;
    model?: string;
    mcp_tools?: string;
  };
}
```

### MCP Tool Calls

```typescript
// Slack update
mcp__slack__chat_update({
  channel: string,
  ts: string,
  text: string
});

// Notion page creation
mcp__notionApi__API-post-page({
  parent: { page_id: string },
  properties: { title: TitleProperty },
  children: Block[]
});
```

---

## Configuration Reference

### Environment Variables

**Cloudflare Worker**:
```toml
[vars]
GITHUB_OWNER = "username"
GITHUB_REPO = "claude-slack-bot"
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"

# Secrets (set with wrangler secret put)
SLACK_SIGNING_SECRET = "..."
SLACK_BOT_TOKEN = "xoxb-..."
GITHUB_TOKEN = "ghp_..."
```

**GitHub Actions**:
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
  SLACK_TEAM_ID: ${{ secrets.SLACK_TEAM_ID }}
  NOTION_KEY: ${{ secrets.NOTION_KEY }}
  GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

**Claude Environment**:
```yaml
claude_env: |
  ANTHROPIC_PROMPT_CACHING=1
  CLAUDE_CODE_AUTORUN_TOOLS=true
  CLAUDE_CODE_THINKING=$THINKING
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

### MCP Server Configuration

Generated dynamically by `prepare-mcp-config.sh`:
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "...",
        "SLACK_TEAM_ID": "..."
      }
    },
    "notionApi": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer ...\",\"Notion-Version\":\"2022-06-28\"}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    }
  }
}
```

---

## MCP Integration

### Available MCP Servers

1. **Slack** (`@modelcontextprotocol/server-slack`)
   - Tools: chat_postMessage, chat_update, users_info, conversations_replies
   - Used for: Updating messages, fetching thread context

2. **Notion** (`@notionhq/notion-mcp-server`)
   - Tools: API-post-page, API-get-page, API-patch-page
   - Used for: Creating documentation pages

3. **GitHub** (`@modelcontextprotocol/server-github`)
   - Tools: create_issue, create_pull_request, get_file_contents
   - Used for: Repository interactions

### Adding New MCP Servers

1. Update `prepare-mcp-config.sh`:
```bash
"newServer": {
  "command": "npx",
  "args": ["-y", "@org/mcp-server-name"],
  "env": {
    "API_KEY": "${NEW_API_KEY}"
  }
}
```

2. Add to allowed tools in workflow:
```yaml
allowed_tools: "newServer__tool_name,${{ github.event.inputs.mcp_tools }}..."
```

---

## Security & Permissions

### Slack Request Verification

```typescript
const signature = crypto.subtle.sign(
  'HMAC',
  await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ),
  encoder.encode(`v0:${timestamp}:${body}`)
);
```

### Token Security

- **Never logged**: Tokens truncated in logs
- **Encrypted storage**: Cloudflare encrypts secrets at rest
- **Minimal exposure**: Tokens only available where needed
- **Rotation support**: Easy to update via wrangler/GitHub UI

### Permission Model

**Development**: Interactive approval for each tool
**CI/CD**: `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true`

---

## Performance Optimization

### Response Time Optimization

1. **Immediate placeholder**: Posted within 100ms
2. **Parallel operations**: Thread fetch + dispatch concurrent
3. **KV caching**: Reduces Slack API calls
4. **Minimal bundle**: Worker <100KB

### Resource Usage

- **Worker CPU**: <10ms per request
- **Memory**: <128MB
- **GitHub Actions**: 2-5 minutes per request
- **API calls**: Minimized via caching

### Scaling Considerations

- **Concurrent requests**: Unlimited (Worker scales automatically)
- **Rate limits**: Slack (1/sec), GitHub (5000/hr), Anthropic (varies)
- **Cost optimization**: Free tiers sufficient for most teams

---

## Extension Points

### Custom Commands

Add to `eventHandler.ts`:
```typescript
if (text.includes('/custom')) {
  // Custom logic
  params.system_prompt += '\nCustom behavior...';
}
```

### Additional MCP Tools

1. Create/find MCP server
2. Add to `prepare-mcp-config.sh`
3. Update allowed_tools in workflow
4. Document usage in system prompt

### Webhook Integrations

```typescript
// Add to eventHandler.ts
if (params.question.includes('webhook trigger')) {
  await fetch('https://webhook.site/...', {
    method: 'POST',
    body: JSON.stringify({ event: 'claude_response', ... })
  });
}
```

### Custom Models

Add to model detection:
```typescript
const customModels = {
  'gpt4': 'gpt-4-turbo',  // If using proxy
  'custom': 'anthropic/custom-model'
};
```

---

## Debugging & Development

### Local Development

```bash
# Start local Worker
wrangler dev

# Test with ngrok for Slack events
ngrok http 8787
```

### Debug Mode

Enable verbose logging:
```typescript
// Add to wrangler.toml
[vars]
DEBUG = "true"

// In code
if (env.DEBUG) {
  console.log('Detailed info:', data);
}
```

### Testing Workflows

```bash
# Manual workflow trigger
gh workflow run claude-code-processor.yml \
  -f question="test" \
  -f slack_channel="C123" \
  -f slack_ts="123.456"
```

---

## Best Practices

1. **Always verify configuration** after changes
2. **Monitor logs** during deployment
3. **Test incrementally** - add features one at a time
4. **Document changes** in code and README
5. **Rotate tokens** regularly
6. **Cache appropriately** to reduce API calls
7. **Handle errors gracefully** with user-friendly messages
8. **Keep bundle small** for Worker performance

---

*This technical reference is maintained alongside the codebase. For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md). For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).*