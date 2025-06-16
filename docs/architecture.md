# 🏗️ Claude Slack Bot Architecture

## Overview

The Claude Slack Bot uses a distributed architecture that combines Cloudflare Workers (for fast response times) with GitHub Actions (for running Claude Code with MCP tools).

## Message Flow Diagram

```
User in Slack                    Cloudflare Worker                GitHub Actions              Claude + MCP
     |                                  |                               |                          |
     |--(@claude what is X?)----------->|                               |                          |
     |                                  |                               |                          |
     |<-(🤔 Working...)-----------------|                               |                          |
     |                                  |                               |                          |
     |                                  |---(dispatch workflow)-------->|                          |
     |                                  |                               |                          |
     |                                  |                               |---(run Claude Code)------>|
     |                                  |                               |                          |
     |                                  |                               |<---(save to file)---------|
     |                                  |                               |                          |
     |                                  |                               |---(read file)            |
     |                                  |                               |                          |
     |<=============(Updated message)===================================|                          |
     |                                  |                               |                          |
```

## Why This Architecture?

### 1. **Cloudflare Worker** (Edge Component)
- ✅ Responds in <3 seconds (Slack requirement)
- ✅ Handles signature verification
- ✅ Posts placeholder immediately
- ✅ Triggers GitHub Actions
- ✅ Manages thread context caching
- ❌ Can't run Claude (1MB limit, 10ms CPU)

### 2. **GitHub Actions** (Runner Component)
- ✅ Long-running processes (up to 6 hours)
- ✅ Can install MCP servers
- ✅ Runs Claude Code action
- ✅ Updates Slack via API
- ✅ Free tier: 2000 minutes/month
- ❌ Not suitable for real-time responses

### 3. **Claude Code + MCP** (Intelligence Layer)
- ✅ Full tool access (Notion, GitHub, Slack, etc.)
- ✅ Can process complex requests
- ✅ Saves responses to files
- ✅ Supports thinking mode for advanced models
- ❌ MCP Slack server lacks message update capability

## The Key Innovation

Since the MCP Slack server can't update existing messages, we implement a workaround:
1. Claude performs all complex work using MCP tools
2. Claude saves the final response to a file
3. GitHub Actions reads the file and updates the Slack message via REST API

This gives users a seamless experience - they see their "Working..." message transform into Claude's response!

## Component Details

### Cloudflare Worker

**Responsibilities:**
- Verify Slack request signatures (HMAC-SHA256)
- Respond within 3 seconds to avoid Slack timeout
- Post initial "Working..." message
- Cache thread context in KV storage
- Trigger GitHub Actions workflow
- Handle errors gracefully

**Key Files:**
- `src/index.ts` - Main entry point
- `src/middleware/verifySlack.ts` - Security verification
- `src/services/eventHandler.ts` - Process Slack events
- `src/services/githubDispatcher.ts` - Trigger workflows
- `src/services/slackClient.ts` - Slack API wrapper

### GitHub Actions

**Responsibilities:**
- Receive workflow dispatch from Worker
- Generate MCP configuration dynamically
- Run Claude Code with appropriate model
- Handle MCP server lifecycle
- Update Slack message with response
- Save Q&A to Notion

**Key Files:**
- `.github/workflows/claude-code-processor.yml` - Main workflow
- `scripts/prepare-mcp-config.sh` - Dynamic MCP config

### MCP Servers

**Available Servers:**
- **Slack** - Read channels, get thread context
- **Notion** - Create and search pages
- **GitHub** - Access repos, issues, PRs
- **Drive** - (Coming soon)

## Workflow Comparison

| Workflow Type | MCP Support | Updates Message | Speed | Complexity | Use Case |
|---------------|-------------|-----------------|-------|------------|----------|
| `Standard` | ✅ Full | ✅ Yes | Medium | Low | Recommended for most users |
| `Direct API` | ❌ None | ✅ Yes | Fast | Very Low | Simple queries, debugging |
| `Thread Reply` | ✅ Full | ❌ Thread only | Medium | Low | When updates fail |

## Data Flow

### 1. Request Processing
```
Slack Event → Worker validates → Posts placeholder → Dispatches workflow
```

### 2. Context Gathering
```
Worker fetches thread → Caches in KV → Passes to workflow → Claude uses context
```

### 3. Response Generation
```
Claude processes → Uses MCP tools → Generates response → Saves to file
```

### 4. Message Update
```
Workflow reads file → Calls Slack API → Updates placeholder → User sees response
```

## Scalability Considerations

### Cloudflare Worker Limits
- 1 MiB compressed size
- 10ms CPU time per request
- 128 MiB memory
- Unlimited requests (with billing)

### GitHub Actions Limits
- 2,000 minutes/month (free)
- 6 hour max job duration
- 20 concurrent jobs
- 500 MB artifact storage

### Optimization Strategies
1. **Cache aggressively** - Thread context, user names
2. **Use appropriate models** - Fast models for simple queries
3. **Batch operations** - Multiple tool calls in one turn
4. **Monitor usage** - Track GitHub Actions minutes

## Security Architecture

### Authentication Flow
```
Slack → HMAC signature → Worker verifies → GitHub PAT → Actions → API keys → Services
```

### Secret Management
- **Cloudflare**: Encrypted secrets via wrangler
- **GitHub**: Repository secrets
- **No secrets in code**: All injected at runtime

### Access Control
- Slack signature verification
- GitHub token scoping
- MCP server permissions
- Notion integration limits

## Error Handling

### Worker Level
- Invalid signatures → 401 response
- Missing data → 400 response  
- Dispatch failures → Retry with backoff

### Action Level
- API failures → Logged and reported
- MCP errors → Fallback to basic response
- Timeout → Partial response saved

### User Experience
- Always see initial acknowledgment
- Errors shown in updated message
- Thread context preserved
- Graceful degradation

## Future Enhancements

### Planned Features
1. **WebSocket support** - Real-time updates
2. **Multi-workspace** - SaaS deployment
3. **Custom MCP servers** - Extended capabilities
4. **Analytics dashboard** - Usage tracking

### Architecture Evolution
1. **Edge database** - Durable Objects for state
2. **Streaming responses** - Progressive updates
3. **Federated MCP** - Distributed tool network
4. **AI agents** - Multi-step workflows