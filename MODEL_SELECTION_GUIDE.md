# 🎯 Model Selection for Claude Slack Bot

## How to Use

You can now specify which Claude model to use in your Slack messages:

### Examples
```
@claude using sonnet-3.5 what is 2+2?
@claude with claude-3-7-sonnet-20250219 analyze this data
@claude model: sonnet-4 write a detailed report
```

### Available Models

| Model ID | Aliases | Description |
|----------|---------|-------------|
| `claude-3-7-sonnet-20250219` | `sonnet-3.7` | Latest Sonnet 3.7 |
| `claude-3-5-sonnet-20241022` | `sonnet-3.5` | Sonnet 3.5 (default) |
| `claude-sonnet-4-20250514` | `sonnet-4`, `opus-4` | Sonnet 4 / Opus 4 |

### Default Behavior
If no model is specified, the bot uses `claude-3-5-sonnet-20241022` by default.

### Supported Patterns
The bot recognizes these patterns for model selection:
- `model: <model-name>`
- `using <model-name>`
- `with <model-name>`

### What Changed

1. **Event Handler** now extracts model preference from messages
2. **Workflows** accept model as an input parameter
3. **Placeholder message** shows which model is being used
4. **Aliases** for easier model selection

### Examples in Action

```
User: @claude using sonnet-3.7 explain quantum computing
Bot: 🤔 Working on your request (using Sonnet 3.7)...
[Bot updates with response using Claude 3.7]

User: @claude model: opus-4 what is the meaning of life?
Bot: 🤔 Working on your request (using Sonnet 4)...
[Bot updates with response using Sonnet 4]

User: @claude what time is it?
Bot: 🤔 Working on your request...
[Bot uses default model: Sonnet 3.5]
```

### Testing Your Setup

1. Deploy the updated Worker:
   ```bash
   wrangler deploy
   ```

2. Test with different models:
   ```
   @claude using sonnet-3.7 test message
   @claude with sonnet-4 another test
   @claude model: sonnet-3.5 final test
   ```

3. Check GitHub Actions to verify the correct model is being used

### Notes

- Model names are case-insensitive
- Partial matches work (e.g., "3.7" matches "sonnet-3.7")
- Invalid models fall back to the default
- The GitHub Action log will show which model is being used