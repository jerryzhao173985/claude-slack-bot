# 🚀 Quick Start Guide

## Before You Deploy

Make sure you have:
- ✅ Set `NOTION_KEY` in GitHub Secrets
- ✅ Created Notion integration
- ✅ Other required secrets configured

## Deploy Your Bot

```bash
./deploy.sh
```

## Test in Slack

### Basic Test
```
@claude hello
```

### Model Selection
```
@claude /model advanced analyze our codebase
@claude fast mode what's 2+2?
@claude smart mode write documentation
```

## Monitor

```bash
# Watch logs
wrangler tail

# Check GitHub Actions
# Go to: Actions tab → "Claude Code Processor Ultimate"
```

## Models Available

- **Advanced** (`/model advanced`) → Sonnet 4 🧠
- **Fast** (`/model fast`) → Sonnet 3.5  
- **Latest** (`/model latest`) → Sonnet 3.7 🧠

🧠 = Supports thinking mode for deeper reasoning

## Troubleshooting

Bot not responding?
1. Check `wrangler tail` for errors
2. Verify bot is in channel
3. Check GitHub Actions tab

Wrong model?
- Bot shows model in message: "(using Sonnet 4)"
- Check logs for "Model extracted"

## That's it! 🎉

Your bot is clean, configured, and ready to use!