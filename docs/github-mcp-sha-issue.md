# GitHub MCP SHA Issue

## Problem
The GitHub MCP server's `create_or_update_file` method fails with `"sha" wasn't supplied` when trying to update existing files. This is because the GitHub API requires the current file SHA when updating files to prevent accidental overwrites.

## Root Cause
The `github-mcp-server` implementation has a limitation where:
1. The `create_or_update_file` method doesn't automatically fetch the current SHA
2. It also doesn't accept a SHA parameter to pass through

## Current Behavior (From Logs)
```
mcp__github__create_or_update_file -> FAILS with "sha" wasn't supplied
mcp__github__get_file_contents -> Gets file with SHA
But no way to pass SHA to create_or_update_file
```

## Workarounds

### Option 1: Use push_files Instead
The `push_files` method handles multiple files and manages SHAs automatically:
```javascript
mcp__github__push_files({
  owner: "user",
  repo: "repo",
  branch: "branch",
  message: "commit message",
  files: [{
    path: "file.txt",
    content: "new content"
  }]
})
```

### Option 2: Two-Step Process
1. Get the file first: `mcp__github__get_file_contents`
2. Delete the old file: `mcp__github__delete_file` 
3. Create new file: `mcp__github__create_or_update_file`

### Option 3: Direct API Call
Use Bash to make direct GitHub API calls with proper SHA handling:
```bash
# Get current SHA
SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/owner/repo/contents/file?ref=branch" \
  | jq -r '.sha')

# Update with SHA
curl -X PUT -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/owner/repo/contents/file" \
  -d '{
    "message": "Update file",
    "content": "'$(base64 -w 0 < file)'",
    "sha": "'$SHA'",
    "branch": "branch"
  }'
```

## Recommended Solution for Claude

When Claude needs to update files in a GitHub repository, it should:

1. **For single file updates**: Use the two-step process or direct API calls
2. **For multiple files**: Use `push_files` which handles SHAs automatically
3. **For new files**: `create_or_update_file` works fine

## Long-term Fix

The GitHub MCP server needs to be updated to either:
1. Automatically fetch SHA when updating existing files
2. Accept an optional SHA parameter
3. Provide a separate `update_file` method that handles SHA

Until then, Claude should be aware of this limitation and use the workarounds.

## Impact on Our System

This affects any workflow where Claude tries to:
- Enhance existing files in a repository
- Update configuration files
- Modify source code

The error message "sha wasn't supplied" is a clear indicator of this issue.