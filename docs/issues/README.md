# 🐛 Issues & Bug Fixes

This directory contains detailed documentation of all significant issues encountered during the Claude Slack Bot development and their resolutions.

## Issue Index

| ID | Title | Severity | Status | Impact |
|----|-------|----------|--------|---------|
| [001](001-missing-mcp-tools-parameter.md) | Missing mcp_tools Parameter | Critical | Resolved | Complete bot failure |
| [002](002-notion-content-missing.md) | Notion Pages Without Content | High | Resolved | Empty documentation pages |
| [003](003-mcp-permission-errors.md) | MCP Permission Errors in CI | High | Resolved | Tools blocked in workflows |
| [004](004-workflow-rename-deployment.md) | Workflow Rename Without Redeploy | High | Resolved | Bot stopped responding |
| [005](005-github-mcp-full-integration.md) | GitHub MCP Full Integration | Enhancement | Implemented | 26+ GitHub tools with smart permissions |

## Common Patterns

### 1. Configuration Sync Issues
- **Pattern**: Configuration changes not taking effect
- **Solution**: Always redeploy Worker with `npm run deploy`
- **Examples**: Issues #001, #004

### 2. CI/CD Environment Differences
- **Pattern**: Features work locally but fail in GitHub Actions
- **Solution**: Test in CI environment, use CI-specific configs
- **Examples**: Issues #002, #003

### 3. API Contract Mismatches
- **Pattern**: Client sends data server doesn't expect
- **Solution**: Maintain strict API contracts, validate both sides
- **Examples**: Issue #001

### 4. Multi-Step Operation Failures
- **Pattern**: Second step of multi-step process fails silently
- **Solution**: Use atomic operations when possible
- **Examples**: Issue #002

## Prevention Strategies

1. **Always Redeploy**: After any configuration change
2. **Test End-to-End**: Verify full flow after changes
3. **Monitor Errors**: Watch logs during deployment
4. **Document Clearly**: Note CI-specific requirements
5. **Validate Contracts**: Ensure client/server alignment

## Quick Fixes

### Bot Not Responding?
1. Check workflow has `mcp_tools` parameter (#001)
2. Redeploy Worker after config changes (#004)
3. Verify all secrets are set

### Notion Issues?
1. Include all content in initial creation (#002)
2. Check parent page is shared with integration
3. Verify API key has correct permissions

### Permission Errors?
1. Add `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true` for CI (#003)
2. Ensure MCP servers are configured correctly
3. Check tool names match exactly

## Contributing

When documenting new issues:

1. Use the next sequential ID (005, 006, etc.)
2. Follow the template structure
3. Include concrete examples
4. Document both problem and solution
5. Add prevention strategies
6. Update this README index

## Issue Template

```markdown
# Issue #XXX: Brief Title

**Status**: Open/Resolved  
**Severity**: Low/Medium/High/Critical  
**Date**: YYYY-MM  
**Impact**: What broke and how it affected users

## Summary
Brief description of the issue.

## Root Cause
Why did this happen?

## Technical Details
Code examples, error messages, logs.

## Resolution
How was it fixed?

## Prevention
How to avoid this in the future.

## Lessons Learned
Key takeaways from this issue.
```