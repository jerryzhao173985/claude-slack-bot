# Issue #003: MCP Permission Errors in CI

**Status**: Resolved  
**Severity**: High  
**Date**: June 2025  
**Impact**: Claude Code unable to use MCP tools in GitHub Actions

## Summary

Claude Code was requesting permission to use MCP tools (like `mcp__notionApi__API-post-page`) but couldn't proceed in the non-interactive CI environment, causing workflows to hang.

## Root Cause

Claude Code's default permission mode requires interactive approval for each tool use. In CI/CD environments, there's no way to provide this approval, causing the workflow to stall.

## Technical Details

### Error Message

```
Claude requested permissions to use mcp__notionApi__API-post-page, but you haven't granted it yet. Please approve the tool use and try again.
```

### Failed Attempts

1. **`permission_mode: "all"`** - Invalid parameter, not recognized by action
2. **`auto_approve: true`** - Not a valid configuration option
3. **Various workflow parameters** - None addressed the core issue

### Successful Solution

Added environment variable to bypass permission checks:

```yaml
- name: Run Claude Code
  uses: anthropics/claude-code-base-action@beta
  with:
    claude_env: |
      CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

## Resolution

The `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true` environment variable bypasses all permission checks, allowing MCP tools to run without interactive approval.

## Implementation

```yaml
claude_env: |
  ANTHROPIC_PROMPT_CACHING=1
  CLAUDE_CODE_AUTORUN_TOOLS=true
  CLAUDE_CODE_THINKING=$THINKING
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true  # Critical for CI!
```

## Security Considerations

- **Use only in trusted environments**: This bypasses ALL security checks
- **Not for interactive use**: Only appropriate for CI/CD
- **Review tool usage**: Ensure only trusted MCP servers are configured

## Prevention

1. **Documentation**: Always check for CI-specific configuration
2. **Environment Detection**: Future versions could auto-detect CI environment
3. **Explicit CI Mode**: Action could provide a `ci_mode` parameter

## Lessons Learned

- Security features designed for interactive use need CI bypasses
- Environment variables can override default behaviors
- The solution was documented but not prominently featured
- "DANGEROUSLY" in the name signals the security implications