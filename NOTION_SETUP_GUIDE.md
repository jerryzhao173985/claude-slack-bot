# Notion Setup Guide for Claude Slack Bot

## Your API Key Status ✅

Good news! Your Notion API key is working perfectly:
- **Bot Name**: Claude Code
- **Type**: Internal Integration Bot
- **Workspace**: RL & Robotics

## The Issue

Your Notion integration is an "internal" integration, which cannot create top-level workspace pages. It needs a parent page to work with.

## Quick Setup Instructions

### Option 1: Manual Setup (Recommended)

1. **Open Notion** in your browser
2. **Create a new page** called "Claude Code" anywhere in your workspace
3. **Share it with your integration**:
   - Click the "..." menu in the top right
   - Click "Add connections"
   - Search for "Claude Code" 
   - Select your integration
4. **Copy the page ID** from the URL:
   - URL format: `https://www.notion.so/Page-Name-<PAGE_ID>`
   - Copy just the ID part (32 characters, no dashes)

### Option 2: Use Existing Page

If you already have pages in Notion:
1. Run the "Test Notion with Parent Page" workflow
2. It will automatically find an existing page and use it as parent

## Testing the Integration

Once you have a parent page:

1. Run the workflow:
   ```
   Go to Actions → Test Notion with Parent Page → Run workflow
   ```

2. It will create:
   - A test page under your parent
   - A "Claude Code Q&A Sessions" sub-page for the bot

## For the Slack Bot

The bot will automatically:
1. Search for the "Claude Code" page
2. Create it if not found (under any existing page)
3. Save all Q&A sessions there

## Troubleshooting

If you're still having issues:
1. Make sure the "Claude Code" integration is added to the page
2. Check that your API key starts with `secret_`
3. Verify the integration has full access in Notion settings

## Next Steps

After setup:
1. Push all the fixes to GitHub
2. Deploy the Slack bot
3. Test with `@claude hello world`
4. Check Notion for the saved Q&A session!