# GitHub Actions Input Limit Fix - Final Implementation

## Problem
GitHub Actions only allows up to 10 inputs for `workflow_dispatch` events. We had 12 inputs, causing deployment failures.

## Solution
Removed 2 inputs that were not essential:
1. **`mcp_tools`** - The workflow already configures all MCP servers, this wasn't used
2. **`enable_checkpointing`** - Always true, so we just always enable checkpointing

## Final 10 Inputs

| Input | Purpose | Required |
|-------|---------|----------|
| `question` | User's request from Slack | Yes |
| `slack_channel` | Channel to update | Yes |
| `slack_ts` | Message timestamp to update | Yes |
| `slack_thread_ts` | Thread context | No |
| `system_prompt` | Thread history and context | No |
| `model` | Claude model selection | No |
| `repository_context` | GitHub repo information | No |
| `max_turns` | Dynamic turn allocation (15-50) | No |
| `timeout_minutes` | Dynamic timeout (10-45 min) | No |
| `session_id` | Session continuation support | No |

## Key Benefits

1. **No JSON complexity** - All inputs are simple strings
2. **Dynamic timeout preserved** - Still scales from 10-45 minutes based on complexity
3. **All functionality maintained** - Session management, checkpointing, progress monitoring
4. **Clean implementation** - No complex parsing in workflow

## Changes Made

### 1. Workflow File
- Removed `mcp_tools` input (not used)
- Removed `enable_checkpointing` input (always true)
- Always upload checkpoint artifacts

### 2. EventHandler
- Removed mcp_tools from dispatch (tools already determined from question)
- Removed enable_checkpointing (no longer needed)
- Sends exactly 10 inputs to workflow

### 3. Types
- Updated `GitHubWorkflowInputs` interface to match
- Removed obsolete fields

## Result
✅ Exactly 10 inputs - at GitHub's limit
✅ Clean, simple implementation without JSON metadata
✅ All features working: dynamic timeout, session management, checkpointing
✅ TypeScript compilation passes