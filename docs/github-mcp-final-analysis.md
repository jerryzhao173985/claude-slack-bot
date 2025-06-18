# GitHub MCP File Operations - Final Analysis

## The Complete Picture

After deep investigation, here's the accurate understanding of the SHA timeout issue:

### What Actually Happens

1. **Claude calls `create_or_update_file` without SHA for an existing file**
2. **GitHub API immediately returns 422 error**: "sha" wasn't supplied
3. **MCP server receives the error** but doesn't handle it properly
4. **MCP client waits for response** that never comes (communication issue)
5. **GitHub Actions workflow times out** after 10 minutes (exit code 124)

### The Real Problem

It's not that the GitHub API hangs - it returns an error immediately. The issue is in the MCP client/server communication layer that doesn't properly propagate the error back to Claude.

### Available Tools (Confirmed)

1. **`create_or_update_file`**
   - Parameters: owner, repo, path, content, message, branch, **sha (optional)**
   - SHA is optional but REQUIRED for updating existing files
   - Works fine for new files without SHA

2. **`push_files`**
   - Parameters: owner, repo, branch, files (array), message
   - Handles SHA automatically using Git tree API
   - Better for multiple files or when you don't have SHA

3. **`get_file_contents`**
   - Returns file content AND its SHA
   - Use this first if you need to update with `create_or_update_file`

### Correct Solutions

#### Solution 1: Use push_files (Recommended)
```javascript
mcp__github__push_files({
  owner: "user",
  repo: "repo",
  branch: "main",
  message: "Update file",
  files: [{
    path: "existing-file.txt",
    content: "new content"
  }]
})
```

#### Solution 2: Get SHA First
```javascript
// Step 1: Get file and its SHA
const file = mcp__github__get_file_contents({
  owner: "user",
  repo: "repo",
  path: "existing-file.txt"
})

// Step 2: Update with SHA
mcp__github__create_or_update_file({
  owner: "user",
  repo: "repo",
  path: "existing-file.txt",
  content: "new content",
  message: "Update file",
  branch: "main",
  sha: file.sha  // Include the SHA!
})
```

### Why Our Guidance Works

Even though `create_or_update_file` CAN work with SHA, recommending `push_files` for existing files is still the best practice because:

1. **Simpler**: No need to fetch SHA first
2. **Faster**: One operation instead of two
3. **Safer**: Avoids the timeout issue entirely
4. **Better for batches**: Can update multiple files atomically

### The Timeout Issue

The 10-minute timeout happens because:
- MCP client has known timeout issues (supposed to be 60 seconds)
- Timeout doesn't trigger properly when server errors occur
- GitHub Actions workflow timeout (10 minutes) kicks in first
- Result: Confusing timeout instead of clear error message

### Verification

This has been verified against:
- GitHub MCP server v0.5.0 documentation
- MCP TypeScript SDK known issues
- GitHub API documentation
- Real-world error reports

### Conclusion

The guidance to use `push_files` for existing files remains correct and is the best practice. The timeout issue is real but caused by MCP communication problems, not GitHub API behavior.