# 📊 Workflow Comparison - Original vs Current

## Original Working Version (First Commit)
```yaml
name: Claude Code Processor

on:
  workflow_dispatch:
    inputs:
      question:
        description: "User question from Slack"
        required: true
        type: string
      mcp_tools:                                    # ✅ THIS WAS PRESENT
        description: "Comma-separated list of MCP tools to enable"
        required: false
        type: string
        default: "slack"
      slack_channel:
        description: "Slack channel ID"
        required: true
        type: string
      slack_ts:
        description: "Slack message timestamp (placeholder)"
        required: true
        type: string
      slack_thread_ts:
        description: "Slack thread timestamp"
        required: false
        type: string
      system_prompt:
        description: "System prompt with thread context"
        required: false
        type: string
```

## Ultimate Version (What You Were Using)
```yaml
name: Claude Code Processor Ultimate

on:
  workflow_dispatch:
    inputs:
      question:
        description: "User question from Slack"
        required: true
        type: string
      # ❌ mcp_tools MISSING!
      slack_channel:
        description: "Slack channel ID"
        required: true
        type: string
      slack_ts:
        description: "Slack message timestamp"
        required: true
        type: string
      slack_thread_ts:
        description: "Slack thread timestamp"
        required: false
        type: string
      system_prompt:
        description: "Additional context (e.g., thread history)"
        required: false
        type: string
      model:                                        # ✅ NEW ADDITION
        description: "Claude model to use"
        required: false
        type: string
        default: "claude-sonnet-4-20250514"
```

## What the Worker Sends
```typescript
// From eventHandler.ts - ALWAYS sends these:
await this.githubDispatcher.dispatchWorkflow({
  question,
  mcp_tools: tools.join(','),    // ⚠️ ALWAYS SENT
  slack_channel: channel,
  slack_ts: placeholder.ts,
  slack_thread_ts: thread_ts || ts,
  system_prompt: this.githubDispatcher.buildSystemPrompt(context),
  model,                          // Added later
});
```

## The Problem

1. Worker **always** sends `mcp_tools` in the dispatch request
2. Ultimate workflow **never** had `mcp_tools` defined as input
3. GitHub rejects with 422: "Unexpected inputs provided: ["mcp_tools"]"

## Why It "Worked" Before

Possible explanations:
1. You were using the original `claude-code-processor.yml` which had `mcp_tools`
2. The error was happening but being swallowed somewhere
3. Worker wasn't properly deployed with latest changes

## The Complete Fix

We need ALL parameters that the Worker sends:
- ✅ question
- ✅ mcp_tools (was missing!)
- ✅ slack_channel  
- ✅ slack_ts
- ✅ slack_thread_ts
- ✅ system_prompt
- ✅ model