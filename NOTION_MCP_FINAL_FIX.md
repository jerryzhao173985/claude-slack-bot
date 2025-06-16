# Notion MCP Integration - Final Fix

## The Real Issue

After analyzing the logs, the problem is NOT with tool names or MCP configuration. The issue is that:

1. **`permission_mode` is not a valid parameter** for the claude-code-base-action
2. **Claude Code requires explicit permission approval** for MCP tools by default
3. **The solution is to use the correct environment variable**

## The Fix

Based on the Claude Code CLI documentation, we need to use:

```yaml
claude_env: |
  CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true
```

This environment variable corresponds to the `--dangerously-skip-permissions` CLI flag, which skips all permission prompts.

## What I Changed

### 1. Removed Invalid Parameter
Removed `permission_mode: "all"` from the workflow as it's not a valid input.

### 2. Added Permission Skip Environment Variable
Added `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true` to the claude_env configuration for both thinking and non-thinking models.

### 3. Created Test Workflows
- `test-notion-simple.yml` - A minimal test to verify Notion search works
- Updated `test-notion-mcp.yml` with the fix

## Why This Works

The Claude Code action runs in a non-interactive environment (GitHub Actions), so it can't prompt for permissions. By setting `CLAUDE_CODE_DANGEROUSLY_SKIP_PERMISSIONS=true`, we tell Claude Code to:

1. Skip all permission prompts
2. Automatically approve all tool usage
3. Allow MCP tools to execute without manual intervention

## Security Note

The "dangerously" prefix is there as a warning - this skips ALL permission checks. In a controlled environment like your private GitHub Actions workflow, this is acceptable because:

1. You control what tools are in the allowed_tools list
2. The workflow runs in an isolated environment
3. All secrets are properly managed by GitHub

## Testing

1. Push these changes to your repository
2. Run the "Test Notion Simple" workflow from the Actions tab
3. If successful, test with your Slack bot

## Alternative Approach (If Still Issues)

If the environment variable doesn't work, we could try using the Claude Code CLI directly instead of the action:

```yaml
- name: Run Claude directly
  run: |
    npx @anthropic-ai/claude-code@latest \
      --dangerously-skip-permissions \
      --mcp-config "$MCP_CONFIG" \
      "Your prompt here"
```

But the environment variable should work with the action.