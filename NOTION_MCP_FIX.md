# Notion MCP Tool Names Fix

## Issue
The Claude Slack Bot was receiving permission errors when trying to use Notion MCP tools. The error showed:
```
Permission denied to run tool mcp__notionApi__API-post-search
```

## Root Cause
The actual tool names exposed by the `@notionhq/notion-mcp-server` use an "API-" prefix pattern (e.g., `API-post-search`), but our workflow configuration was using incorrect tool names (e.g., `search`, `create_page`).

## Solution
Updated the `allowed_tools` list in `.github/workflows/claude-code-processor-ultimate.yml` to include the correct Notion MCP tool names:

### Old Tool Names (Incorrect)
- `mcp__notionApi__create_page`
- `mcp__notionApi__retrieve_page`
- `mcp__notionApi__search`
- `mcp__notionApi__append_block_children`
- `mcp__notionApi__retrieve_block_children`
- `mcp__notionApi__query_database`

### New Tool Names (Correct)
- `mcp__notionApi__API-post-search`
- `mcp__notionApi__API-post-comments`
- `mcp__notionApi__API-post-pages`
- `mcp__notionApi__API-get-pages`
- `mcp__notionApi__API-get-blocks`
- `mcp__notionApi__API-post-blocks`
- `mcp__notionApi__API-patch-blocks`
- `mcp__notionApi__API-delete-blocks`
- `mcp__notionApi__API-get-databases`
- `mcp__notionApi__API-post-databases`
- `mcp__notionApi__API-get-users`
- `mcp__notionApi__API-get-comments`

## Files Modified
1. `.github/workflows/claude-code-processor-ultimate.yml`
   - Updated the `allowed_tools` parameter to include correct Notion MCP tool names
   - Updated the prompt instructions to use correct tool names

2. `test.sh`
   - Updated the test to check for the correct tool name (`mcp__notionApi__API-post-search`)

## Deployment Steps
1. Commit and push these changes to your repository
2. Redeploy the Cloudflare Worker (if needed): `./deploy.sh`
3. Test the Slack bot with a mention that should trigger Notion integration

## Verification
- Run `bash test.sh` to verify the configuration is correct
- The test should show "✅ Notion tools in allowed_tools"
- Monitor the GitHub Actions logs to ensure Claude can now access the Notion MCP tools

## Additional Notes
The Notion MCP server follows the OpenAPI specification pattern for tool naming, using HTTP method prefixes (GET, POST, PATCH, DELETE) in the tool names. This is different from other MCP servers like Slack which use more descriptive names.