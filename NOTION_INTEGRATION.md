# 📝 Notion Integration Guide

## Overview

The Claude Slack Bot automatically saves every question and response to your Notion workspace, creating a searchable knowledge base of all interactions.

## How It Works

1. **Automatic Recording**: Every Q&A is saved as a Notion page
2. **Organization**: Pages are stored under a "Claude Code" parent page
3. **Rich Metadata**: Each page includes timestamp, channel, and model information
4. **Searchable**: All interactions become searchable in Notion

## Setup Instructions

### 1. Create Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Configure:
   - Name: "Claude Slack Bot"
   - Associated workspace: Select your workspace
   - Capabilities: 
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Copy the "Internal Integration Token"

### 2. Add Integration to GitHub Secrets

```bash
# In your GitHub repository settings
Settings → Secrets and variables → Actions → New repository secret
Name: NOTION_KEY
Value: [paste your integration token]
```

### 3. Share Pages with Integration

In Notion:
1. Create a page titled "Claude Code" (or it will be created automatically)
2. Click "..." menu → "Add connections" → Select your integration
3. The bot will create all Q&A pages under this parent

## Page Structure

Each Q&A session creates a page with:

```
Title: [User's Question]

## Question
[Full question from Slack]

## Answer
[Claude's complete response]

## Metadata
- Timestamp: 2024-01-15 10:30:45 UTC
- Channel: C028006PA23
- Model: claude-3-5-sonnet-20241022
- User: @username
```

## Features

### Automatic Organization
- Pages are created under "Claude Code" folder
- Chronological ordering by default
- Easy to browse and search

### Rich Content
- Full question and answer preserved
- Code blocks formatted properly
- Links and formatting maintained

### Searchability
- Use Notion's search to find past Q&As
- Filter by date, channel, or content
- Build a knowledge base over time

## Troubleshooting

### Pages Not Being Created?

1. **Check Integration Token**:
   - Verify `NOTION_KEY` is set in GitHub Secrets
   - Ensure token has correct permissions

2. **Check Logs**:
   ```bash
   # View GitHub Actions logs for errors
   # Look for "Notion" related messages
   ```

3. **Verify Parent Page**:
   - Ensure "Claude Code" page exists
   - Check it's shared with the integration

### Permission Errors?

- Integration needs "Insert content" capability
- Parent page must be shared with integration
- Check workspace restrictions

## Advanced Usage

### Custom Organization

To organize by date or channel, modify the prompt in the workflow to create a hierarchy:
```
Claude Code/
├── 2024-01/
│   ├── Question 1
│   └── Question 2
└── 2024-02/
    └── Question 3
```

### Filtering MCP Tools

If you see permission errors for specific Notion tools, you can limit which ones are available by modifying `allowed_tools` in the workflow.

## Benefits

1. **Knowledge Base**: Build a searchable repository of all Q&As
2. **Team Learning**: Share solutions across your organization
3. **Audit Trail**: Track all bot interactions
4. **No Extra Work**: Happens automatically with every query

## Privacy Considerations

- All Slack Q&As will be saved to Notion
- Ensure your Notion workspace has appropriate access controls
- Consider data retention policies
- Sensitive information will be preserved

## Next Steps

1. Deploy the updated bot: `./deploy.sh`
2. Test with: `@claude what is 2+2?`
3. Check Notion for the created page
4. Start building your knowledge base!