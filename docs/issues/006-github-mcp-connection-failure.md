# Issue #006: GitHub MCP Server Connection Failure

**Status**: Resolved  
**Severity**: Critical  
**Date**: 2025-06  
**Impact**: GitHub tools completely unavailable, fallback to gh CLI also failed

## Summary

The GitHub MCP server failed to initialize during GitHub Actions workflow execution, preventing all GitHub operations. The fallback gh CLI also failed due to missing GH_TOKEN environment variable in the Claude processing step.

## Root Cause

The GitHub MCP server requires the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable to authenticate with GitHub API. While this was correctly set in the MCP configuration, the Claude Code action itself also needs access to `GH_TOKEN` for its internal gh CLI fallback mechanism. When the MCP server fails to connect, Claude attempts to use gh CLI, which requires the GH_TOKEN to be available in the action's environment.

## Technical Details

### Error Log Analysis

From the GitHub Actions log:

```
Initializing MCP servers...
- github (npx -y github-mcp-server --toolsets all): failed
- notionApi (npx -y @notionhq/notion-mcp-server): connected
- slack (npx -y @modelcontextprotocol/server-slack): connected

Available tools after initialization:
mcp__notionApi__API-post-search,mcp__notionApi__API-post-page,mcp__slack__slack_reply_to_thread,mcp__slack__slack_get_thread_replies,mcp__slack__slack_get_users,mcp__slack__slack_get_user_profile,Write,Read,Bash,WebSearch
```

The GitHub MCP server showed status "failed" while other servers connected successfully.

### Claude's Fallback Attempt

When GitHub tools weren't available, Claude attempted to use gh CLI:

```bash
gh api repos/jerryzhao173985/reference_model
```

This resulted in the error:

```
gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable. Example:
  env:
    GH_TOKEN: ${{ github.token }}
```

### MCP Configuration (Was Correct)

The MCP configuration already had the correct token:

```json
"github": {
  "command": "npx",
  "args": ["-y", "github-mcp-server", "--toolsets", "all"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${{ secrets.GH_TOKEN }}"
  }
}
```

## Resolution

Added the `GH_TOKEN` environment variable to the Claude processing step in the workflow:

```yaml
- name: Process with Claude
  uses: anthropics/claude-code-base-action@beta
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
  with:
    # ... rest of configuration
```

This fix ensures:
1. The gh CLI has authentication when used as a fallback
2. Any internal GitHub operations in the Claude Code action have proper credentials
3. Both the MCP server and fallback mechanisms can authenticate properly

## Prevention

1. **Environment Variable Documentation**: Clearly document all required environment variables for both MCP servers and the Claude Code action itself
2. **Comprehensive Testing**: Test both successful MCP connections and fallback scenarios
3. **Error Monitoring**: Monitor MCP server initialization status in logs
4. **Defensive Configuration**: Ensure authentication is available at multiple levels (MCP config, action env)

## Testing After Fix

To verify the fix works:

1. **Check MCP Server Status**: The github server should show "connected" instead of "failed"
2. **Verify Tool Availability**: All 26+ GitHub tools should appear in the available tools list
3. **Test GitHub Operations**: Commands like "@claude analyze repo" should work without falling back to gh CLI
4. **Test Fallback**: Even if MCP fails, gh CLI should now authenticate properly

## Impact Analysis

Before the fix:
- No GitHub operations were possible through MCP tools
- Fallback gh CLI also failed, leaving no GitHub access
- Users couldn't analyze repositories or perform any GitHub operations

After the fix:
- Primary: GitHub MCP server should connect successfully
- Fallback: Even if MCP fails, gh CLI can authenticate and work
- Full GitHub functionality restored with 26+ tools available

## Lessons Learned

1. **Multiple Authentication Layers**: Modern tools often require authentication at multiple levels - don't assume one configuration covers all cases
2. **Fallback Testing**: Always test both primary and fallback mechanisms
3. **Environment Variable Scope**: GitHub Actions environment variables need to be explicitly passed to each step that needs them
4. **MCP Server Debugging**: When an MCP server fails, check both its specific requirements and any fallback mechanisms Claude might use
5. **Action Documentation**: The Claude Code action's internal use of gh CLI wasn't immediately obvious from documentation

## Related Issues

- Issue #005: GitHub MCP Full Integration (the enhancement that exposed this issue)
- Similar authentication patterns might affect other MCP servers in the future

## Configuration Checklist

For proper GitHub integration, ensure:

- [ ] `GH_TOKEN` secret is set in GitHub repository settings
- [ ] MCP config includes `GITHUB_PERSONAL_ACCESS_TOKEN`
- [ ] Claude action step includes `env: { GH_TOKEN: ${{ secrets.GH_TOKEN }} }`
- [ ] Token has appropriate scopes for all operations
- [ ] Workflow has all GitHub tools in allowed_tools list