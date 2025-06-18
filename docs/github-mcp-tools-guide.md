# GitHub MCP Tools Complete Guide

## Overview

This guide documents all available GitHub MCP (Model Context Protocol) tools provided by the official GitHub MCP Server v0.5.0. These tools enable Claude to interact with GitHub repositories, issues, pull requests, and more.

## Tool Categories

### 🧑 User Tools
- `mcp__github__get_me` - Get authenticated user information
- `mcp__github__search_users` - Search for GitHub users

### 📁 Repository Tools
- `mcp__github__search_repositories` - Search for repositories
- `mcp__github__create_repository` - Create a new repository
- `mcp__github__fork_repository` - Fork an existing repository

### 📄 File & Content Tools
- `mcp__github__get_file_contents` - Read file contents from a repository
- `mcp__github__create_or_update_file` - Create or update a single file
- `mcp__github__delete_file` - Delete a file from a repository
- `mcp__github__push_files` - Push multiple files in a single commit
- `mcp__github__search_code` - Search for code across repositories

### 🌿 Branch & Commit Tools
- `mcp__github__create_branch` - Create a new branch
- `mcp__github__list_branches` - List all branches in a repository
- `mcp__github__list_commits` - List commits in a repository
- `mcp__github__get_commit` - Get details of a specific commit

### 🏷️ Tag Tools
- `mcp__github__list_tags` - List all tags in a repository
- `mcp__github__get_tag` - Get details of a specific tag

### 🐛 Issue Tools
- `mcp__github__get_issue` - Get issue details
- `mcp__github__get_issue_comments` - Get comments on an issue
- `mcp__github__list_issues` - List issues in a repository
- `mcp__github__search_issues` - Search issues and pull requests
- `mcp__github__create_issue` - Create a new issue
- `mcp__github__add_issue_comment` - Add a comment to an issue
- `mcp__github__update_issue` - Update issue (title, body, labels, etc.)
- `mcp__github__assign_copilot_to_issue` - Assign Copilot to help with an issue

### 🔀 Pull Request Tools

#### Basic PR Operations
- `mcp__github__get_pull_request` - Get PR details
- `mcp__github__list_pull_requests` - List PRs in a repository
- `mcp__github__create_pull_request` - Create a new PR
- `mcp__github__merge_pull_request` - Merge a PR
- `mcp__github__update_pull_request` - Update PR details
- `mcp__github__update_pull_request_branch` - Update PR branch with base branch

#### PR Content Tools
- `mcp__github__get_pull_request_files` - Get list of files changed in PR
- `mcp__github__get_pull_request_diff` - Get the diff of a PR
- `mcp__github__get_pull_request_comments` - Get comments on a PR
- `mcp__github__get_pull_request_reviews` - Get reviews on a PR
- `mcp__github__get_pull_request_status` - Get PR status checks

#### PR Review Tools
- `mcp__github__create_pending_pull_request_review` - Start a new review
- `mcp__github__add_pull_request_review_comment_to_pending_review` - Add comment to pending review
- `mcp__github__submit_pending_pull_request_review` - Submit a pending review
- `mcp__github__delete_pending_pull_request_review` - Delete a pending review
- `mcp__github__create_and_submit_pull_request_review` - Create and submit review in one step
- `mcp__github__request_copilot_review` - Request Copilot to review PR

### 🔔 Notification Tools
- `mcp__github__list_notifications` - List user notifications
- `mcp__github__get_notification_details` - Get details of a notification
- `mcp__github__mark_all_notifications_read` - Mark all notifications as read
- `mcp__github__dismiss_notification` - Dismiss a specific notification
- `mcp__github__manage_notification_subscription` - Manage notification subscriptions
- `mcp__github__manage_repository_notification_subscription` - Manage repo notification settings

### 🔒 Security Tools
- `mcp__github__list_code_scanning_alerts` - List code scanning security alerts
- `mcp__github__get_code_scanning_alert` - Get details of a code scanning alert
- `mcp__github__list_secret_scanning_alerts` - List secret scanning alerts
- `mcp__github__get_secret_scanning_alert` - Get details of a secret scanning alert

## Security Considerations

### Permission Model
According to Claude Code's security documentation:
- Claude Code uses a **permission-based architecture**
- By default, it operates with **strict read-only permissions**
- Additional actions require **explicit permission** from the user
- Users are responsible for configuring trusted MCP servers

### Best Practices
1. **Review Tool Permissions**: Understand what each tool can do before granting access
2. **Limit Write Access**: Only enable write operations for repositories you own
3. **Monitor Usage**: Keep track of what operations Claude performs
4. **Use Read-Only Mode**: When possible, restrict to read-only operations

## Configuration

### In GitHub Actions Workflow

The tools are configured in the `allowed_tools` parameter:

```yaml
allowed_tools: |
  Write,
  Read,
  Bash,
  WebSearch,
  mcp__slack__slack_get_thread_replies,
  # ... other tools ...
  mcp__github__get_me,
  mcp__github__get_issue,
  # ... all GitHub MCP tools ...
```

### MCP Server Configuration

```yaml
mcp_config: |
  {
    "mcpServers": {
      "github": {
        "command": "github-mcp-server",
        "args": ["stdio", "--toolsets", "all"],
        "env": { 
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${{ secrets.GH_TOKEN }}" 
        }
      }
    }
  }
```

## Common Use Cases

### 1. Code Review Workflow
```
1. mcp__github__get_pull_request - Get PR details
2. mcp__github__get_pull_request_files - See changed files
3. mcp__github__get_pull_request_diff - Review the diff
4. mcp__github__create_and_submit_pull_request_review - Submit review
```

### 2. Issue Management
```
1. mcp__github__search_issues - Find related issues
2. mcp__github__create_issue - Create new issue
3. mcp__github__add_issue_comment - Add updates
4. mcp__github__update_issue - Close or update status
```

### 3. Code Updates
```
1. mcp__github__create_branch - Create feature branch
2. mcp__github__push_files - Push changes
3. mcp__github__create_pull_request - Open PR
4. mcp__github__merge_pull_request - Merge when ready
```

## Troubleshooting

### Common Errors

1. **"Permission denied" errors**
   - Ensure the tool is in the `allowed_tools` list
   - Check that your GitHub token has necessary scopes

2. **"Tool not found" errors**
   - Verify the exact tool name (case-sensitive)
   - Ensure the GitHub MCP server is properly configured

3. **Token limitations**
   - Some tools return large responses (e.g., `get_pull_request_files`)
   - Use pagination or filtering when available

## Version Information

- **GitHub MCP Server**: v0.5.0
- **Release Date**: Based on latest release
- **Documentation**: [GitHub MCP Server Repository](https://github.com/github/github-mcp-server)

## Updates and Maintenance

To stay updated:
1. Check the [GitHub MCP Server releases](https://github.com/github/github-mcp-server/releases)
2. Review Claude Code documentation for security updates
3. Monitor the allowed tools list for new additions

## Related Documentation

- [Claude Code Security](https://docs.anthropic.com/en/docs/claude-code/security)
- [GitHub MCP Server Documentation](https://github.com/github/github-mcp-server)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)