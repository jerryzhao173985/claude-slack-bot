# Notion MCP Permission Fix

## Problem Identified

The Notion MCP server connects successfully, but Claude can't use any Notion tools due to permission restrictions:
- Error: `"Claude requested permissions to use mcp__notionApi__API-post-page, but you haven't granted it yet."`
- Root cause: `"permissionMode":"default"` - the default mode restricts MCP tool access

## Solution

Add `permission_mode: "all"` to the Claude Code action configuration in `.github/workflows/claude-code-processor-ultimate.yml`:

```yaml
- name: Run Claude Code with Proper Permissions
  uses: anthropics/claude-code-base-action@beta
  with:
    # ... other parameters ...
    permission_mode: "all"  # This grants access to all tools including MCP
```

## Permission Modes Explained

The Claude Code action supports different permission modes:
- **"default"**: Restrictive mode, requires explicit permission grants for each tool
- **"all"**: Grants access to all tools in the allowed_tools list
- **"acceptEdits"**: Intermediate mode for file editing permissions

## Additional Checks

### 1. Verify Notion Token Format
Your `NOTION_KEY` should start with `secret_` (not `ntn_`):
```
secret_abc123...
```

### 2. Check GitHub Secrets
Ensure `NOTION_KEY` is properly set in GitHub Secrets:
- Go to Settings → Secrets → Actions
- Verify `NOTION_KEY` exists and has a valid value

### 3. Test Notion Integration Access
Your Notion integration needs:
- Read/write access to at least one page
- Proper workspace permissions

## Testing the Fix

After deploying this fix:
1. Mention Claude in Slack: `@claude test notion integration`
2. Claude should now be able to:
   - Search for "Claude Code" page
   - Create pages if needed
   - Save Q&A sessions

## Why This Happens

The Claude Code action has a security feature that prevents tools from being used without explicit permission. The `permission_mode: "all"` parameter tells the action to trust and allow all tools listed in `allowed_tools`, including MCP server tools.

## Alternative Solutions

If `permission_mode: "all"` is too permissive for your security needs, you could:
1. Use `permission_mode: "acceptEdits"` for a middle ground
2. Implement a custom permission handler
3. Use the direct Notion API instead of MCP

However, for a Slack bot that needs to save to Notion, `permission_mode: "all"` is the most straightforward solution.