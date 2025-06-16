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
   - Name: "Claude Code"
   - Associated workspace: Select your workspace
   - Capabilities: 
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Copy the "Internal Integration Token" (starts with `secret_`)

### 2. Add Integration to GitHub Secrets

```bash
# In your GitHub repository settings
Settings → Secrets and variables → Actions → New repository secret
Name: NOTION_KEY
Value: [paste your integration token]
```

### 3. Create Parent Page in Notion

Since internal integrations cannot create top-level workspace pages, you need to create a parent page:

1. **Open Notion** in your browser
2. **Create a new page** called "Claude Code" anywhere in your workspace
3. **Share it with your integration**:
   - Click the "..." menu in the top right
   - Click "Add connections"
   - Search for "Claude Code" 
   - Select your integration
4. The bot will automatically find this page and create all Q&A sessions under it

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
   - Ensure token starts with `secret_`
   - Verify token has correct permissions

2. **Check Parent Page**:
   - Ensure "Claude Code" page exists in Notion
   - Verify it's shared with the integration
   - Check the "Add connections" menu shows your integration

3. **Check Logs**:
   ```bash
   # View GitHub Actions logs for errors
   # Look for "Notion" related messages
   ```

### Permission Errors?

- Integration needs "Insert content" capability
- Parent page must be shared with integration
- Check workspace restrictions

### Internal Integration Limitations

**Important:** Internal integrations have specific limitations you should be aware of:

1. **Cannot create top-level pages** - Must have a parent page
2. **Workspace-specific** - Only works in the workspace where it was created
3. **No public sharing** - Cannot be distributed to other Notion users
4. **Limited API access** - Some advanced features may be restricted

**Why Internal Integration?**
- Simpler setup (no OAuth flow)
- Better for single-workspace use
- More secure for private data
- Sufficient for bot's Q&A logging needs

**Workaround for Page Creation:**
The bot automatically searches for a page named "Claude Code" in your workspace. If not found, it will:
1. Find any accessible page in your workspace
2. Create "Claude Code" as a child of that page
3. Use it for all future Q&A sessions

This ensures the bot works even if you forget to create the parent page manually.

### API Key Status Check

If you're having issues, verify your integration:
- **Bot Name**: Should match your integration name
- **Type**: Internal Integration Bot
- **Workspace**: Should be your Notion workspace

## Title Generation

The bot automatically generates clean, descriptive titles for each Q&A session:

### Title Rules
1. **Keep it under 50 characters**
2. **Remove @ mentions and special characters**
3. **Make it descriptive and searchable**
4. **Use title case**
5. **For greetings/small talk, use date-based titles**

### Examples

| User Question | Generated Title |
|--------------|-----------------|
| "@claude how do I use python decorators?" | "How to Use Python Decorators" |
| "@claude explain git merge vs rebase" | "Git Merge vs Rebase Explained" |
| "@claude debug this TypeError" | "Debug React TypeError" |
| "@claude what is machine learning?" | "What Is Machine Learning" |
| "@claude hello" | "Chat Session - 2024-01-16" |
| "@claude write email validation function" | "Email Validation Function" |

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

### Pages Created Without Content?

If Notion pages are being created with only titles but no content, ensure:

1. **Check the workflow uses single API call**: The page content must be included in the `children` array when creating the page
2. **Verify block structure**: Each block must have the correct type (paragraph, heading_1, etc.) and rich_text format
3. **Monitor GitHub Actions logs**: Look for any errors when creating the page
4. **Test manually**: Try creating a simple test page to verify the integration works:
   ```
   @claude test notion: save this message
   ```

The fix implemented includes all content blocks in the initial `API-post-page` call, which is more reliable than separate create/update operations.

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

1. Create your Notion integration
2. Add the API key to GitHub Secrets
3. Create and share the "Claude Code" page
4. Deploy the bot: `./deploy.sh`
5. Test with: `@claude what is 2+2?`
6. Check Notion for the created page
7. Start building your knowledge base!