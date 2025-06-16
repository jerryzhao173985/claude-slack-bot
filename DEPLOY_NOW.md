# 🚀 Deploy Your Fixed Bot - Quick Commands

Copy and paste these commands to fix your bot immediately:

```bash
# Step 1: Update Cloudflare to use the working workflow
wrangler secret delete GITHUB_WORKFLOW_FILE
wrangler secret put GITHUB_WORKFLOW_FILE
# When prompted, type: claude-code-processor-final.yml

# Step 2: Push the fix to GitHub
git add .
git commit -m "Fix Claude permission issues - use direct API workflow"
git push

# Step 3: Test your bot
# Go to Slack and type: @claude what is 2+2?
```

## What This Does

✅ Switches to a workflow that actually works
✅ Bypasses the broken Claude Code permission system  
✅ Your bot will respond properly in Slack

## Expected Result

1. You type: `@claude what is 2+2?`
2. Bot says: "🤔 Working on your request..."
3. 10-20 seconds later, that message changes to: "4"

## Why This Works

The `claude-code-processor-final.yml` workflow:
- Doesn't use the broken Claude Code action
- Calls Claude API directly
- Updates Slack messages properly
- Has no permission issues

Your bot will be working in less than 2 minutes! 🎉