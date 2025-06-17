# Issue #006: GitHub MCP Server Connection Failure

**Status**: Resolved  
**Severity**: Critical  
**Date**: 2025-06  
**Impact**: GitHub tools completely unavailable, fallback to gh CLI also failed

## Summary

The GitHub MCP server failed to initialize during GitHub Actions workflow execution, preventing all GitHub operations. The fallback gh CLI also failed due to missing GH_TOKEN environment variable in the Claude processing step.

## Root Cause

The GitHub MCP server failed to connect because `github-mcp-server` is not available as an npm package. The official GitHub MCP server from https://github.com/github/github-mcp-server is distributed as:
1. A Docker image (`ghcr.io/github/github-mcp-server`)
2. Pre-built binaries for various platforms
3. Source code that can be compiled with Go

The `npx -y github-mcp-server` command was trying to find an npm package that doesn't exist, causing the connection failure. The `@modelcontextprotocol/server-github` npm package exists but has been deprecated in favor of GitHub's official implementation.

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

Implemented a two-part solution:

1. **Download the pre-built binary** in the workflow:
```yaml
- name: Install GitHub MCP Server
  run: |
    echo "Downloading github-mcp-server binary..."
    curl -L https://github.com/github/github-mcp-server/releases/download/v0.5.0/github-mcp-server_Linux_x86_64.tar.gz | tar xz -C ~/.local/bin
    chmod +x ~/.local/bin/github-mcp-server
    echo "$HOME/.local/bin" >> $GITHUB_PATH
```

2. **Update MCP configuration** to use the binary with stdio:
```json
"github": {
  "command": "github-mcp-server",
  "args": ["stdio", "--toolsets", "all"],
  "env": { 
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${{ secrets.GH_TOKEN }}" 
  }
}
```
**Important**: The `stdio` argument is required for MCP communication.

3. **Added GH_TOKEN environment variable** for gh CLI fallback:
```yaml
- name: Process with Claude
  uses: anthropics/claude-code-base-action@beta
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

This ensures:
1. The official GitHub MCP server binary is available in the PATH
2. The MCP configuration correctly invokes the binary
3. The gh CLI has authentication for fallback scenarios

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

1. **Package Distribution Methods**: Not all MCP servers are distributed as npm packages - some use Docker images or binaries
2. **Check Official Sources**: Always verify the official distribution method from the source repository
3. **Deprecation Awareness**: The `@modelcontextprotocol/server-github` npm package was deprecated in favor of GitHub's official implementation
4. **Binary Installation**: Pre-built binaries can be downloaded and used in GitHub Actions workflows
5. **Multiple Authentication Layers**: Ensure both the MCP server and fallback tools (gh CLI) have proper authentication

## Related Issues

- Issue #005: GitHub MCP Full Integration (the enhancement that exposed this issue)
- Similar authentication patterns might affect other MCP servers in the future

## Configuration Checklist

For proper GitHub integration, ensure:

- [ ] `GH_TOKEN` secret is set in GitHub repository settings
- [ ] GitHub MCP server binary is downloaded and installed in the workflow
- [ ] MCP config uses `github-mcp-server` command (not npx)
- [ ] MCP config includes `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable
- [ ] Claude action step includes `env: { GH_TOKEN: ${{ secrets.GH_TOKEN }} }` for gh CLI fallback
- [ ] Token has appropriate scopes for all operations
- [ ] Workflow has all GitHub tools in allowed_tools list
- [ ] The `--toolsets all` argument is included for full functionality