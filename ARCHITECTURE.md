# Claude Slack Bot Architecture

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

### 1. **Cloudflare Worker** (Edge)
- ✅ Responds in <3 seconds (Slack requirement)
- ✅ Handles signature verification
- ✅ Posts placeholder immediately
- ✅ Triggers GitHub Actions
- ❌ Can't run Claude (1MB limit, 10ms CPU)

### 2. **GitHub Actions** (Runner)
- ✅ Long-running processes
- ✅ Can install MCP servers
- ✅ Runs Claude Code action
- ✅ Updates Slack via API
- ✅ Free tier: 2000 minutes/month

### 3. **Claude Code + MCP**
- ✅ Full tool access (Notion, GitHub, etc.)
- ✅ Can process complex requests
- ✅ Saves responses to files
- ❌ MCP Slack server lacks update tool

## The Key Innovation

Since MCP Slack server can't update messages, we:
1. Let Claude do all the complex work with MCP tools
2. Have Claude save the response to a file
3. Use Slack's REST API directly to update the message

This gives users the best experience - they see their "Working..." message seamlessly transform into Claude's response!

## Workflow Comparison

| Workflow | MCP Support | Updates Message | Speed | Complexity |
|----------|-------------|-----------------|-------|------------|
| `best.yml` | ✅ Full | ✅ Yes | Medium | Low |
| `direct.yml` | ❌ None | ✅ Yes | Fast | Very Low |
| `fixed.yml` | ✅ Full | ❌ Thread reply | Medium | Low |

## Configuration Files

```
.
├── .github/workflows/
│   ├── claude-code-processor-best.yml    # Recommended
│   ├── claude-code-processor-direct.yml  # Simple fallback
│   └── claude-code-processor-fixed.yml   # Thread replies
├── src/
│   ├── services/
│   │   ├── eventHandler.ts    # Processes Slack events
│   │   ├── githubDispatcher.ts # Triggers workflows
│   │   └── slackClient.ts     # Slack API wrapper
│   └── middleware/
│       └── verifySlack.ts     # Security (HMAC)
└── scripts/
    ├── quick-fix.sh          # Easy setup
    └── test-bot.sh           # Testing guide
```