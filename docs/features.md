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