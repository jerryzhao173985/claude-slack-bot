# 🚀 Claude Slack Bot Features

## 🧵 Thread Context

### Overview

The Claude Slack Bot has full thread context awareness! When you mention Claude in a Slack thread, it automatically reads all previous messages in the thread and uses them to provide contextual responses.

### How It Works

#### Automatic Context Collection
1. When mentioned in a thread, the bot fetches up to 50 previous messages
2. Messages are formatted with timestamps and user names
3. The context is passed to Claude as additional system prompt information
4. Claude uses this context to provide relevant, contextual responses

#### Thread-Aware Commands

The bot recognizes various thread-related patterns:
- "summarize this thread"
- "what was discussed above?"
- "what did [user] say about [topic]?"
- "can you explain the context?"
- "what are the key points from this discussion?"

### Usage Examples

#### Thread Summarization
```
@claude summarize this thread
```
Claude will read all messages and provide a concise summary.

#### Finding Specific Information
```
@claude what did John suggest about the API design?
```
Claude will search through the thread for John's comments about API design.

#### Contextual Questions
```
@claude based on the discussion above, what should we do next?
```
Claude will analyze the thread and provide recommendations.

### Benefits

1. **No Manual Context**: No need to copy-paste previous messages
2. **Natural Conversations**: Claude understands the flow of discussion
3. **Better Answers**: Responses are informed by the full context
4. **Time Saving**: Quickly get summaries of long threads

### Technical Details

- Thread messages are cached in Cloudflare KV for performance
- User IDs are resolved to real names for better readability
- Bot messages are marked to avoid confusion
- Context is limited to 50 messages to stay within token limits

---

## 🧠 Thinking Mode

### Overview

Claude Code's thinking mode allows models to engage in deeper reasoning before responding. This feature is automatically enabled for supported models and disabled for others.

### Supported Models

| Model | Thinking Mode | Description |
|-------|--------------|-------------|
| **Sonnet 4** (claude-sonnet-4-20250514) | ✅ Enabled | Most advanced reasoning capabilities |
| **Sonnet 3.7** (claude-3-7-sonnet-20250219) | ✅ Enabled | Latest model with thinking support |
| **Sonnet 3.5** (claude-3-5-sonnet-20241022) | ❌ Disabled | Fast responses without thinking |

### How It Works

The bot automatically detects which model you're using and configures thinking mode accordingly:

1. **For Sonnet 4 & 3.7**: Thinking is enabled by default, allowing for more thorough analysis
2. **For Sonnet 3.5**: Thinking is disabled to prevent errors, providing quick responses

### Visual Indicators

When you mention the bot in Slack, you'll see:
- 🧠 emoji next to models that support thinking
- No emoji for models without thinking support

Example:
- `:thinking_face: Working on your request (using Sonnet 4 🧠)...`
- `:thinking_face: Working on your request (using Sonnet 3.5)...`

### Usage Examples

#### Complex Task (Auto-selects Sonnet 4 with thinking)
```
@claude write a comprehensive analysis of our architecture
```

#### Quick Task (Uses Sonnet 3.5 without thinking)
```
@claude /model fast what's 2+2?
```

#### Force Thinking Mode
```
@claude /model advanced explain this complex algorithm
```

### Technical Implementation

The workflow dynamically sets environment variables based on the selected model:

```yaml
# For models that support thinking (3.7, 4)
CLAUDE_CODE_THINKING=true

# For Sonnet 3.5
CLAUDE_CODE_THINKING=false
```

This ensures compatibility across all models while leveraging advanced features when available.

---

## 🤖 Model Selection

### Overview

You can specify which Claude model to use in your Slack messages using various natural patterns. The bot recognizes your preference and uses the appropriate model.

### Available Models

| Model ID | Aliases | Description | Thinking Mode |
|----------|---------|-------------|---------------|
| `claude-3-7-sonnet-20250219` | `sonnet-3.7`, `3.7`, `smart` | Latest Sonnet 3.7 | ✅ Enabled |
| `claude-3-5-sonnet-20241022` | `sonnet-3.5`, `3.5`, `fast` | Sonnet 3.5 (default) | ❌ Disabled |
| `claude-sonnet-4-20250514` | `sonnet-4`, `4`, `advanced`, `opus-4` | Most advanced model | ✅ Enabled |

### Selection Methods

#### 1. Slash Commands
```
@claude /model fast what is 2+2?
@claude /model smart analyze this code
@claude /model advanced write a detailed report
```

#### 2. Natural Language Patterns
The bot recognizes these patterns:
- `model: <model-name>`
- `using <model-name>`
- `with <model-name>`
- `use <model-name>`

Examples:
```
@claude using sonnet-3.7 explain quantum computing
@claude with claude-3-5-sonnet-20241022 summarize this thread
@claude model: opus-4 analyze our architecture
@claude use the smart model to review this PR
```

#### 3. Automatic Selection

The bot intelligently selects models based on your request:
- **Complex tasks** → Sonnet 4 with thinking enabled
- **Simple queries** → Sonnet 3.5 for fast responses
- **Default** → Sonnet 3.5 for balanced performance

### Model Capabilities

#### Sonnet 3.5 (Fast Mode)
- Best for: Quick questions, simple tasks, code snippets
- Response time: 10-20 seconds
- No thinking mode (prevents errors)
- Most cost-effective

#### Sonnet 3.7 (Smart Mode)
- Best for: Complex analysis, detailed explanations
- Response time: 20-30 seconds
- Thinking mode enabled for deeper reasoning
- Good balance of capability and speed

#### Sonnet 4 / Opus 4 (Advanced Mode)
- Best for: Complex reasoning, comprehensive analysis
- Response time: 30-60 seconds
- Full thinking mode for maximum capability
- Most powerful option

### Visual Indicators

The bot shows which model is being used:
- `:thinking_face: Working on your request (using Sonnet 3.5)...`
- `:thinking_face: Working on your request (using Sonnet 3.7 🧠)...`
- `:thinking_face: Working on your request (using Sonnet 4 🧠)...`

The 🧠 emoji indicates thinking mode is enabled.

### Usage Examples

```
# Quick calculation
@claude what's 15% of 240?
# Uses default Sonnet 3.5

# Code review with specific model
@claude using 3.7 review this pull request and suggest improvements
# Uses Sonnet 3.7 with thinking

# Complex analysis
@claude /model advanced analyze our system architecture and propose optimizations
# Uses Sonnet 4 with full thinking mode

# Case-insensitive and partial matching
@claude with SONNET-4 explain this
@claude model: 3.5 quick question
@claude use smart mode for this task
```

### Best Practices

1. **Use default for most tasks** - Sonnet 3.5 is fast and capable
2. **Upgrade for complex work** - Use 3.7 or 4 for analysis, planning, or detailed writing
3. **Be explicit when needed** - Specify model for consistent results
4. **Consider response time** - Advanced models take longer but provide better results

### Technical Notes

- Model names are case-insensitive
- Partial matches work (e.g., "3.7" matches "sonnet-3.7")
- Invalid models fall back to the default (Sonnet 3.5)
- The GitHub Action log shows which model is being used
- Model selection is preserved throughout the conversation

---

## 📝 Notion Integration

All Q&A sessions are automatically saved to your Notion workspace, creating a searchable knowledge base. See the [Notion Integration Guide](notion-integration.md) for setup instructions.

---

## 🔧 MCP Tool Integration

The bot integrates with official MCP servers:
- **Slack**: Update messages, read channels
- **Notion**: Create and search pages
- **GitHub**: Access repositories and issues
- **Drive**: Coming soon

Each tool is dynamically enabled based on your workflow configuration.

---

## 🐙 GitHub Repository Analysis

### Overview

The bot now supports deep GitHub repository analysis using the enhanced GitHub MCP server. You can analyze code, review architecture, find security issues, and more - all through natural language commands in Slack.

### How It Works

1. **Automatic Detection**: The bot detects repository references in your messages
2. **Tool Activation**: GitHub MCP tools are automatically enabled when needed
3. **Context Aware**: Repository context is passed to Claude for targeted analysis
4. **Multiple Formats**: Supports various ways to reference repositories

### Supported Patterns

The bot recognizes repositories in multiple formats:

```
# Direct repository reference
@claude analyze jerryzhao173985/reference_model

# GitHub URL
@claude check https://github.com/owner/repo

# Natural language with repository
@claude review the code in facebook/react

# Action-oriented commands
@claude find security issues in my-org/my-project
@claude explain the architecture of vuejs/vue
```

### Available Tools

With the enhanced GitHub MCP server, Claude has access to 26+ tools:

1. **Code & Repository Operations**
   - `get_file_contents`: Read any file in the repository
   - `search_code`: Find specific patterns or implementations
   - `list_commits`: Review recent changes and history
   - `create_or_update_file`: Modify files (owned repos only)
   - `push_files`: Commit multiple files at once (owned repos only)
   - `create_branch`: Create new branches (owned repos only)
   - `search_repositories`: Find repositories

2. **Issue Management**
   - `list_issues`: See open issues and priorities
   - `get_issue`: Deep dive into specific issues
   - `get_issue_comments`: Read issue discussions
   - `create_issue`: Open new issues
   - `add_issue_comment`: Comment on issues
   - `update_issue`: Modify issue details (owned repos only)
   - `search_issues`: Advanced issue search

3. **Pull Request Operations**
   - `create_pull_request`: Open new PRs
   - `list_pull_requests`: View all PRs
   - `get_pull_request`: Get PR details
   - `get_pull_request_files`: Review changed files
   - `merge_pull_request`: Merge PRs (owned repos only)
   - `update_pull_request_branch`: Update PR with latest changes

4. **Code Review Tools**
   - `create_pending_pull_request_review`: Start a review
   - `add_pull_request_review_comment`: Add review comments
   - `create_and_submit_pull_request_review`: Submit complete review
   - `request_copilot_review`: Request AI-powered review (experimental)

5. **User & Auth**
   - `get_me`: Get authenticated user information

### Usage Examples

#### Basic Repository Analysis
```
@claude analyze the code structure of anthropics/claude-code-sdk
```
Claude will examine the repository structure, key files, and provide insights.

#### Security Review
```
@claude find potential security issues in my-company/api-server
```
Claude will search for common security patterns and vulnerabilities.

#### Architecture Overview
```
@claude explain the architecture of https://github.com/nodejs/node
```
Claude will analyze the project structure and explain the architecture.

#### Code Search
```
@claude find all authentication implementations in laravel/framework
```
Claude will search for specific code patterns across the repository.

#### Issue Analysis
```
@claude what are the most critical open issues in kubernetes/kubernetes?
```
Claude will review open issues and prioritize them.

### Advanced Features

1. **Multi-Repository Analysis**
   ```
   @claude compare the error handling between express/express and fastify/fastify
   ```

2. **Historical Analysis**
   ```
   @claude what major changes happened in react/react in the last month?
   ```

3. **Code Quality Assessment**
   ```
   @claude review code quality and suggest improvements for my-org/backend
   ```

### Commands for Your Own Repositories

When analyzing your own repositories (e.g., jerryzhao173985/*), you have full write access:

#### Creating and Managing Files
```
@claude fix the typo in README.md in jerryzhao173985/my-project
@claude create a new file called CONTRIBUTING.md with contribution guidelines
@claude update the package.json to add a new dependency
```

#### Branch and PR Management
```
@claude create a branch called feature/new-api in my repo
@claude create a PR from feature/new-api to main with the recent changes
@claude merge PR #123 after the checks pass
```

#### Issue Management
```
@claude create an issue about the performance problem in the API endpoint
@claude close issue #45 as it's been resolved
@claude add a comment to issue #12 with the workaround
```

#### Code Reviews
```
@claude review PR #89 and suggest improvements
@claude add review comments to the authentication changes
```

### Smart URL Handling

The bot handles various GitHub URL formats:
```
# HTTPS URLs
@claude analyze https://github.com/facebook/react

# With .git extension
@claude check https://github.com/vercel/next.js.git

# SSH format
@claude review git@github.com:microsoft/vscode.git

# Direct file links
@claude explain https://github.com/nodejs/node/blob/main/lib/fs.js

# Clone commands
@claude what does this do: git clone https://github.com/rust-lang/rust.git
```

### Configuration

The GitHub integration uses the official `github-mcp-server` with these toolsets:
- `repos`: Repository and file operations
- `code_security`: Security scanning capabilities
- `issues`: Issue tracking and management
- `context`: Repository context and metadata

### Security Considerations

- Only public repositories are accessible by default
- Uses your configured GitHub Personal Access Token
- Respects GitHub API rate limits
- Read-only operations for safety

### Best Practices

1. **Be Specific**: Include the repository owner and name for accurate results
2. **Use Natural Language**: Ask questions as you would to a colleague
3. **Combine with Thread Context**: Reference previous discussions about code
4. **Request Summaries**: Ask for high-level overviews before diving deep

### Technical Implementation

The bot:
1. Detects repository patterns using regex matching
2. Validates repository references to avoid false positives
3. Adds repository context to the system prompt
4. Enables GitHub MCP tools automatically
5. Uses the enhanced `github-mcp-server` for advanced capabilities