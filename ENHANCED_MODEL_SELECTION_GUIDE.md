# 🚀 Enhanced Model Selection - Complete Guide

## What's New

Your Claude Slack Bot now supports advanced model selection with:
- **Slash commands** like `/model advanced`
- **Named presets** for easy model selection
- **Auto-detection** of complex requests
- **Short aliases** like `/model 4`

## Deployment

```bash
./deploy-advanced-models.sh
```

## Usage Examples

### 1. Slash Commands
```
@claude /model advanced analyze our Q4 performance
@claude /model fast what's the current time?
@claude /model 4 write comprehensive documentation
@claude /mode smart debug this complex issue
```

### 2. Named Presets

#### Advanced Mode (Sonnet 4)
```
@claude advanced mode create a detailed business plan
@claude smart mode analyze this algorithm's complexity
@claude deep mode comprehensive code review
```
**Best for**: Complex analysis, detailed reports, thorough documentation

#### Fast Mode (Sonnet 3.5)
```
@claude fast mode quick summary of this article
@claude balanced mode general question about Python
@claude quick mode what's 15% of 2500?
```
**Best for**: Quick responses, general queries, balanced performance

#### Latest Mode (Sonnet 3.7)
```
@claude latest mode test new AI capabilities
@claude newest mode experimental features demo
```
**Best for**: Testing newest features, latest improvements

### 3. Natural Language
```
@claude using sonnet-4 analyze market trends
@claude with advanced model create architecture diagram
@claude model: 3.5 help me debug this
```

### 4. Short Aliases
```
@claude /model 4      # → Sonnet 4
@claude /model 3.5    # → Sonnet 3.5
@claude /model 3.7    # → Sonnet 3.7
```

### 5. Auto-Selection

The bot automatically uses Sonnet 4 when it detects:
```
@claude write a comprehensive analysis of our codebase
@claude create a detailed technical specification
@claude provide a thorough evaluation of this approach
@claude give me an advanced breakdown of the architecture
```

Keywords that trigger advanced mode:
- comprehensive
- detailed
- thorough
- complex
- advanced

## Complete Alias Reference

| Input | Model | Full ID |
|-------|-------|---------|
| `advanced`, `smart`, `deep` | Sonnet 4 | claude-sonnet-4-20250514 |
| `fast`, `balanced`, `quick` | Sonnet 3.5 | claude-3-5-sonnet-20241022 |
| `latest`, `newest` | Sonnet 3.7 | claude-3-7-sonnet-20250219 |
| `4`, `sonnet-4`, `opus-4` | Sonnet 4 | claude-sonnet-4-20250514 |
| `3.5`, `sonnet-3.5` | Sonnet 3.5 | claude-3-5-sonnet-20241022 |
| `3.7`, `sonnet-3.7` | Sonnet 3.7 | claude-3-7-sonnet-20250219 |

## Visual Feedback

The bot shows which model is being used:
```
User: @claude /model advanced explain quantum computing
Bot: 🤔 Working on your request (using Sonnet 4)...

User: @claude fast mode what's the weather?
Bot: 🤔 Working on your request (using Sonnet 3.5)...
```

## Testing

Run the test suite:
```bash
./test-all-models.sh
```

This will show you all test cases to try in Slack.

## Monitoring

Check which model was selected:
```bash
wrangler tail
```

Look for log entries like:
```
Model extracted from message { modelRef: 'advanced', model: 'claude-sonnet-4-20250514' }
Detected advanced request, using Sonnet 4
```

## Default Behavior

- **No model specified**: Uses Sonnet 3.5 (balanced)
- **Invalid model**: Falls back to default
- **Complex request detected**: Auto-selects Sonnet 4

## Tips & Best Practices

1. **For Complex Tasks**: Use `/model advanced` or include words like "comprehensive"
2. **For Quick Queries**: Use `/model fast` or keep it simple
3. **For Testing**: Use `/model latest` to try newest features
4. **Shortcuts**: Just use numbers like `/model 4` for Sonnet 4

## Common Patterns

### Data Analysis
```
@claude /model advanced analyze our sales data and identify trends
@claude smart mode correlation analysis of these metrics
```

### Quick Help
```
@claude /model fast how do I center a div?
@claude quick mode convert 100 USD to EUR
```

### Code Review
```
@claude advanced mode review this PR for security issues
@claude /model 4 comprehensive code audit
```

### Documentation
```
@claude using sonnet-4 write API documentation
@claude detailed mode create user guide
```

## Troubleshooting

**Bot not recognizing model?**
- Check spelling and spacing
- Verify deployment completed
- Look at Cloudflare logs

**Wrong model being used?**
- Check GitHub Actions for model parameter
- Verify workflow is using Ultimate version
- Check for typos in model name

**Need help?**
- See logs: `wrangler tail`
- Check Actions: GitHub Actions tab
- Test patterns: `./test-all-models.sh`