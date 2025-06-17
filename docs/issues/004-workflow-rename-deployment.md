# Issue #004: Workflow Rename Without Redeployment

**Status**: Resolved  
**Severity**: High  
**Date**: June 2025  
**Impact**: Bot stopped responding after workflow file rename

## Summary

After renaming the workflow from `claude-code-processor-ultimate.yml` to `claude-code-processor.yml`, the bot stopped working because the Cloudflare Worker wasn't redeployed with the new configuration.

## Root Cause

The Worker's configuration (`wrangler.toml`) contains the workflow filename, but changing this configuration doesn't automatically update the deployed Worker. A manual redeployment is required.

## Technical Details

### Configuration Mismatch

**Worker Configuration**:
```toml
[vars]
GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"  # Changed
```

**Deployed Worker State**:
- Still looking for: `claude-code-processor-ultimate.yml`
- Actual file: `claude-code-processor.yml`
- Result: 404 errors from GitHub API

### Error Flow

```
1. Slack mention → 2. Worker dispatches to OLD filename
→ 3. GitHub returns 404 → 4. No workflow runs → 5. User sees no response
```

## Resolution

Simple fix - redeploy the Worker:

```bash
npm run deploy
```

This updates the deployed Worker with the new configuration from `wrangler.toml`.

## Prevention

1. **Deployment Checklist**: Always redeploy after config changes
2. **Automated Deployment**: Consider CI/CD for Worker deployment
3. **Configuration Validation**: Add checks to verify workflow exists
4. **Clear Documentation**: Emphasize redeployment requirement

## Best Practices

### After ANY Configuration Change:
1. Update `wrangler.toml`
2. Run `npm run deploy`
3. Verify with `wrangler tail`
4. Test in Slack

### Configuration Changes That Require Redeployment:
- Workflow filename
- GitHub owner/repo
- Any `[vars]` values
- KV namespace bindings
- Route changes

## Lessons Learned

- Configuration changes don't auto-deploy
- Cloudflare Workers cache configuration at deployment
- Always test after configuration changes
- The #1 fix for Worker issues: redeploy