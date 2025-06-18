# GitHub MCP SHA Error Timeout Analysis

## Executive Summary

The GitHub Actions workflow is timing out after 10 minutes (exit code 124) when Claude attempts to use the GitHub MCP server's `create_or_update_file` method. The root cause is a combination of:

1. **SHA Requirement**: GitHub API requires the current file's SHA when updating existing files
2. **MCP Server Limitation**: The `create_or_update_file` method doesn't handle missing SHA gracefully
3. **Hanging Behavior**: Instead of failing quickly with an error, the operation hangs until the workflow timeout

## The Problem Chain

```
Claude tries to update file
    ↓
Uses mcp__github__create_or_update_file
    ↓
GitHub API requires SHA for updates
    ↓
MCP server doesn't provide SHA automatically
    ↓
Operation hangs (no timeout in MCP client)
    ↓
Workflow times out after 10 minutes
    ↓
Exit code 124 (SIGTERM from timeout)
```

## Why It Hangs Instead of Failing

Based on research and analysis:

1. **MCP Client Timeout Issues**:
   - The MCP TypeScript/JavaScript SDK has a 60-second timeout
   - However, this timeout doesn't always trigger properly
   - Known issue: timeout doesn't reset with server progress updates

2. **GitHub MCP Server Behavior**:
   - When SHA is missing, the server may be attempting to fetch it
   - This fetch operation might be stuck in a retry loop
   - No proper error propagation back to the client

3. **Workflow Level**:
   - The workflow has a 10-minute timeout by default
   - When MCP operation hangs, workflow continues waiting
   - After 10 minutes, workflow is killed with SIGTERM (exit code 124)

## Immediate Solutions

### 1. Avoid create_or_update_file for Existing Files
```yaml
# In the workflow prompt
When updating existing files in GitHub repositories:
1. DO NOT use mcp__github__create_or_update_file for existing files
2. Instead use mcp__github__push_files which handles SHA automatically
3. Or use get_file_contents first to get SHA, then make direct API calls
```

### 2. Add Timeout to MCP Operations
```yaml
# Add to claude_env
CLAUDE_CODE_MCP_TIMEOUT=30000  # 30 seconds instead of hanging forever
```

### 3. Implement Pre-Check Logic
```yaml
# Add to workflow prompt
Before updating any GitHub file:
1. First check if file exists with get_file_contents
2. If exists, use push_files instead of create_or_update_file
3. Only use create_or_update_file for NEW files
```

## Long-Term Solutions

### 1. Fix in GitHub MCP Server
The server should:
- Auto-fetch SHA when updating existing files
- Accept optional SHA parameter
- Fail fast with clear error instead of hanging

### 2. Fix in MCP Client
The client should:
- Enforce timeout on all operations
- Provide better error messages when timeout occurs
- Allow configurable timeouts per operation

### 3. Workflow Improvements
```yaml
# Add operation-specific timeout
- name: Process with Claude
  timeout-minutes: 9  # Less than workflow timeout
  # This ensures Claude step fails before workflow timeout
```

## Detection Pattern

When you see:
- Exit code 124 in GitHub Actions
- 10-minute execution time
- Last operation was GitHub file update
- Error mentions "sha" in any logs

This is the SHA timeout issue.

## Recommended Workflow Update

Add this to the Claude system prompt:

```yaml
## CRITICAL: GitHub File Update Guidelines

When working with GitHub files:

1. **For NEW files only**: Use create_or_update_file
2. **For EXISTING files**: 
   - Use push_files (recommended - handles SHA automatically)
   - Or use Bash with git commands
   - NEVER use create_or_update_file on existing files

3. **Why**: create_or_update_file will hang for 10 minutes on existing files due to missing SHA parameter

4. **Quick Check**:
   ```
   If file exists in repo:
     → Use push_files or git commands
   If file is new:
     → Safe to use create_or_update_file
   ```

This prevents the timeout issue entirely.
```

## Monitoring

Add logging to track when this happens:

```typescript
// In the worker
console.log(`Workflow dispatch initiated at ${new Date().toISOString()}`);
console.log(`Timeout set to ${timeout_minutes} minutes`);

// In the workflow
echo "MCP operations started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "If this hangs, check for SHA-related errors"
```

## Summary

The 10-minute timeout is caused by the GitHub MCP server's `create_or_update_file` method hanging when it encounters an existing file without a SHA parameter. The operation doesn't fail gracefully but instead hangs until the workflow timeout kills it.

The solution is to avoid using `create_or_update_file` for existing files and instead use `push_files` or direct git commands which handle SHA requirements properly.