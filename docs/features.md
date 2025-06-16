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

### Automatic Selection

The bot intelligently selects models based on your request:
- **Complex tasks** → Sonnet 4 with thinking
- **Simple queries** → Sonnet 3.5 for speed
- **Default** → Sonnet 3.5 for balance

### Manual Selection

Use slash commands to choose a specific model:
- `/model fast` or `/model 3.5` → Sonnet 3.5
- `/model smart` or `/model 3.7` → Sonnet 3.7
- `/model advanced` or `/model 4` → Sonnet 4

### Natural Language Selection

Simply mention the model in your message:
- "using sonnet 4" → Selects Sonnet 4
- "with 3.5" → Selects Sonnet 3.5
- "use the smart model" → Selects Sonnet 3.7

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