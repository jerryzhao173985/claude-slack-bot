# 🎯 Advanced Model Selection Guide

## All Supported Patterns

### 1. Slash Command Style
```
@claude /model advanced what is 2+2?
@claude /model sonnet-3.5 analyze this code
@claude /model 4 write a detailed report
@claude /mode smart explain quantum computing
```

### 2. Named Presets
```
@claude advanced mode solve this complex problem
@claude fast mode what time is it?
@claude balanced mode help me debug
@claude smart mode analyze market trends
```

### 3. Natural Language
```
@claude using advanced model explain AI
@claude with sonnet-4 write documentation  
@claude model: 3.7 summarize this article
```

### 4. Contextual Auto-Selection
When your message contains words like "complex", "detailed", "comprehensive", or "thorough", the bot automatically uses the advanced model:
```
@claude write a comprehensive analysis of this data
@claude create a detailed technical specification
```

## Model Presets

### Advanced Mode (Sonnet 4)
- **Aliases**: `advanced`, `smart`, `deep`
- **Model**: `claude-sonnet-4-20250514`
- **Best for**: Complex tasks, detailed analysis, thorough reports
- **Example**: `@claude /model advanced analyze our Q4 performance`

### Fast Mode (Sonnet 3.5)
- **Aliases**: `fast`, `balanced`, `quick`
- **Model**: `claude-3-5-sonnet-20241022`
- **Best for**: Quick responses, general queries, balanced performance
- **Example**: `@claude fast mode what's the weather?`

### Latest Mode (Sonnet 3.7)
- **Aliases**: `latest`, `newest`, `3.7`
- **Model**: `claude-3-7-sonnet-20250219`
- **Best for**: Testing newest features, latest improvements
- **Example**: `@claude /mode latest test new capabilities`

## Quick Reference

### Slash Commands
```
/model <preset>    - Select model by preset name
/model <version>   - Select model by version number
/mode <preset>     - Alternative to /model
```

### Presets
- `advanced` → Sonnet 4 (Most capable)
- `fast` → Sonnet 3.5 (Balanced)
- `latest` → Sonnet 3.7 (Newest)

### Version Numbers
- `4`, `sonnet-4`, `opus-4` → Sonnet 4
- `3.7`, `sonnet-3.7` → Sonnet 3.7
- `3.5`, `sonnet-3.5` → Sonnet 3.5

### Auto-Selection Keywords
Include these words for automatic advanced model:
- complex
- detailed
- comprehensive
- thorough
- advanced

## Examples

### Basic Usage
```
@claude /model advanced create a business plan
@claude /model fast what's 2+2?
@claude /model 3.7 test the latest features
```

### Natural Language
```
@claude using advanced model analyze our codebase
@claude with fast mode quickly summarize this
@claude smart mode solve this algorithm problem
```

### Mixed Patterns
```
@claude /model advanced write a comprehensive report on AI ethics
@claude fast mode just give me a quick summary
@claude using sonnet-4 create detailed documentation
```

### Context-Based Selection
```
@claude write a detailed analysis of market trends
# Automatically uses advanced model due to "detailed"

@claude quick question: what time is it?
# Uses default model for simple query
```

## Visual Feedback

The bot shows which model is being used:
```
User: @claude /model advanced explain quantum computing
Bot: 🤔 Working on your request (using Sonnet 4)...

User: @claude fast mode what's the weather?
Bot: 🤔 Working on your request (using Sonnet 3.5)...

User: @claude write a comprehensive analysis
Bot: 🤔 Working on your request (using Sonnet 4)...
```

## Default Behavior

- If no model specified: Uses Sonnet 3.5 (balanced)
- If context suggests complexity: Auto-selects Sonnet 4
- Invalid model names: Falls back to default

## Tips

1. **For Complex Tasks**: Use `/model advanced` or include words like "detailed"
2. **For Quick Queries**: Use `/model fast` or keep it simple
3. **For Testing**: Use `/model latest` to try newest features
4. **Shortcuts**: Just use numbers like `/model 4` for Sonnet 4