# Issue #001: Missing mcp_tools Parameter

**Status**: Resolved  
**Severity**: Critical  
**Date**: June 2025  
**Impact**: Complete bot failure - no responses to any queries

## Summary

The `mcp_tools` input parameter was accidentally removed from the GitHub workflow during refactoring, causing all workflow dispatches to fail with HTTP 422 errors.

## Timeline

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ Original (Working)  │────▶│ Ultimate (Bug Intro) │────▶│ Cleanup (Bug Found) │
│ HAD mcp_tools      │     │ MISSING mcp_tools    │     │ MISSING mcp_tools   │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
    Commit: f9c1a7c              Silent failures            422 errors
```

## Root Cause

During the creation of `claude-code-processor-ultimate.yml`, the `mcp_tools` input parameter was not copied from the original workflow. When this became the main workflow during cleanup, the parameter remained missing.

## Technical Details

### What Failed

**Worker Always Sends**:
```typescript
await this.githubDispatcher.dispatchWorkflow({
  question,
  mcp_tools: tools.join(','),  // <-- ALWAYS SENT
  slack_channel: channel,
  slack_ts: placeholder.ts,
  slack_thread_ts: thread_ts || ts,
  system_prompt: this.githubDispatcher.buildSystemPrompt(context),
  model,
});
```

**Workflow Missing Input**:
```yaml
# ❌ BROKEN
on:
  workflow_dispatch:
    inputs:
      question:
      slack_channel:
      slack_ts:
      slack_thread_ts:
      system_prompt:
      model:
      # mcp_tools was MISSING!
```

**Error Response**:
```json
{
  "message": "Unexpected inputs provided: [\"mcp_tools\"]",
  "documentation_url": "https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event",
  "status": "422"
}
```

## Resolution

Added the missing parameter to the workflow:

```yaml
# ✅ FIXED
mcp_tools:
  description: "Comma-separated list of MCP tools"
  required: false
  type: string
```

## Prevention

1. **API Contract Testing**: Implement tests that verify workflow inputs match dispatcher outputs
2. **Workflow Validation**: Create a script to validate all required inputs are present
3. **Error Monitoring**: Add alerts for 4xx errors from GitHub API
4. **Careful Refactoring**: Use diff tools when consolidating workflows

## Lessons Learned

- Silent failures in distributed systems are dangerous
- API contracts must be maintained across refactoring
- Version control discipline is critical
- Always test end-to-end after structural changes