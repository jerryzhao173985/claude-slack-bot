# 🧠 Thinking Mode

## Overview

Claude Code's thinking mode allows models to engage in deeper reasoning before responding. This feature is automatically enabled for supported models and disabled for others.

## Supported Models

| Model | Thinking Mode | Description |
|-------|--------------|-------------|
| **Sonnet 4** (claude-sonnet-4-20250514) | ✅ Enabled | Most advanced reasoning capabilities |
| **Sonnet 3.7** (claude-3-7-sonnet-20250219) | ✅ Enabled | Latest model with thinking support |
| **Sonnet 3.5** (claude-3-5-sonnet-20241022) | ❌ Disabled | Fast responses without thinking |

## How It Works

The bot automatically detects which model you're using and configures thinking mode accordingly:

1. **For Sonnet 4 & 3.7**: Thinking is enabled by default, allowing for more thorough analysis
2. **For Sonnet 3.5**: Thinking is disabled to prevent errors, providing quick responses

## Visual Indicators

When you mention the bot in Slack, you'll see:
- 🧠 emoji next to models that support thinking
- No emoji for models without thinking support

Example:
- `:thinking_face: Working on your request (using Sonnet 4 🧠)...`
- `:thinking_face: Working on your request (using Sonnet 3.5)...`

## Usage Examples

### Complex Task (Auto-selects Sonnet 4 with thinking)
```
@claude write a comprehensive analysis of our architecture
```

### Quick Task (Uses Sonnet 3.5 without thinking)
```
@claude /model fast what's 2+2?
```

### Force Thinking Mode
```
@claude /model advanced explain this complex algorithm
```

## Technical Implementation

The workflow dynamically sets environment variables based on the selected model:

```yaml
# For models that support thinking (3.7, 4)
CLAUDE_CODE_THINKING=true

# For Sonnet 3.5
CLAUDE_CODE_THINKING=false
```

This ensures compatibility across all models while leveraging advanced features when available.