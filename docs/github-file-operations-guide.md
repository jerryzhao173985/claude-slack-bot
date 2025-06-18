# GitHub File Operations Guide - Preventing SHA Errors

## Executive Summary

The SHA error ("sha wasn't supplied") is a fundamental GitHub API requirement, not a bug. This guide provides the definitive approach to handle file operations correctly in our Claude Slack bot.

## Understanding the SHA Requirement

### Why GitHub Requires SHA
- **Concurrent Updates**: Prevents overwriting changes made by others
- **Data Integrity**: Ensures you're updating the version you expect
- **Required by Design**: This is NOT optional - it's core to GitHub's API

### When SHA is Required
- ✅ **Updating existing files**: ALWAYS requires current file SHA
- ❌ **Creating new files**: Does NOT require SHA
- ✅ **Deleting files**: Requires SHA to confirm which version to delete

## Recommended Approach for Claude

### 1. For Single File Operations

**Creating a New File**:
```javascript
// Use create_or_update_file - Works fine for NEW files
mcp__github__create_or_update_file({
  owner: "user",
  repo: "repo",
  path: "new-file.txt",
  message: "Create new file",
  content: "file content",
  branch: "main"
})
```

**Updating an Existing File**:
```javascript
// Option 1: Use push_files (RECOMMENDED)
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

// Option 2: Use git commands
bash: |
  git clone https://github.com/user/repo.git
  cd repo
  echo "new content" > existing-file.txt
  git add existing-file.txt
  git commit -m "Update file"
  git push
```

### 2. For Multiple File Operations

**Always use push_files**:
```javascript
mcp__github__push_files({
  owner: "user",
  repo: "repo",
  branch: "main",
  message: "Update multiple files",
  files: [
    { path: "file1.txt", content: "content1" },
    { path: "file2.txt", content: "content2" },
    { path: "file3.txt", content: "content3" }
  ]
})
```

## How push_files Works

The `push_files` method handles SHA automatically by:
1. Creating a new tree with all file changes
2. Creating a commit pointing to that tree
3. Updating the branch reference
4. This bypasses individual file SHA requirements

## Decision Tree for Claude

```
Need to work with GitHub files?
├─ Is it a NEW file?
│  └─ Yes → Use create_or_update_file
│  └─ No → Continue...
├─ Is it a single EXISTING file?
│  └─ Yes → Use push_files or git commands
│  └─ No → Continue...
└─ Multiple files?
   └─ Yes → Always use push_files
```

## Common Scenarios

### Scenario 1: "Fix typo in README"
```javascript
// DO NOT use create_or_update_file - will timeout!
// CORRECT approach:
mcp__github__push_files({
  owner: "user",
  repo: "repo",
  branch: "main",
  message: "Fix typo in README",
  files: [{
    path: "README.md",
    content: "corrected content"
  }]
})
```

### Scenario 2: "Add new feature file"
```javascript
// Safe to use create_or_update_file for NEW files
mcp__github__create_or_update_file({
  owner: "user",
  repo: "repo",
  path: "src/newFeature.js",
  message: "Add new feature",
  content: "feature code",
  branch: "main"
})
```

### Scenario 3: "Update configuration files"
```javascript
// Multiple existing files - use push_files
mcp__github__push_files({
  owner: "user",
  repo: "repo",
  branch: "main",
  message: "Update configuration",
  files: [
    { path: "config/app.json", content: "..." },
    { path: "config/database.yml", content: "..." }
  ]
})
```

## Error Prevention Checklist

Before using create_or_update_file, Claude should:
1. ❓ Ask: "Does this file already exist in the repository?"
2. 🔍 If unsure, use `get_file_contents` to check
3. ✅ If file exists → Use `push_files`
4. ✅ If file is new → Safe to use `create_or_update_file`
5. ⚠️  When in doubt → Use `push_files` (works for both)

## Why This Approach Works

1. **push_files uses Trees API**: Doesn't need individual file SHAs
2. **Atomic operations**: All changes in one commit
3. **Better performance**: Single API call vs multiple
4. **Prevents timeouts**: No hanging on missing SHA

## Implementation in Workflows

Both workflows now include:
```yaml
### CRITICAL: GitHub File Update Guidelines
1. For NEW files only: Use create_or_update_file
2. For EXISTING files: Use push_files (handles SHA automatically)
3. NEVER use create_or_update_file on existing files (10-min timeout)
```

## Monitoring and Detection

Signs of SHA issue:
- Workflow times out after exactly 10 minutes
- Exit code 124
- Last operation was `create_or_update_file`
- No explicit error message (just timeout)

## Long-term Solution

The GitHub MCP server should ideally:
1. Auto-detect if file exists
2. Fetch SHA automatically for updates
3. Fail fast with clear error instead of hanging

Until then, this guide ensures reliable file operations.