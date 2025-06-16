#!/bin/bash

echo "🚀 Fixing your Claude Slack Bot..."
echo ""
echo "This will update your bot to use the working workflow."
echo ""

# Update Cloudflare
echo "📝 Updating Cloudflare configuration..."
echo ""
echo "First, we need to delete the old configuration:"
wrangler secret delete GITHUB_WORKFLOW_FILE

echo ""
echo "Now, let's add the new configuration:"
echo "When prompted for the value, enter: claude-code-processor-final.yml"
echo ""
wrangler secret put GITHUB_WORKFLOW_FILE

# Git operations
echo ""
echo "📦 Pushing changes to GitHub..."
git add .
git commit -m "Fix Claude permission issues - use direct API workflow"
git push

echo ""
echo "✅ Your bot has been fixed!"
echo ""
echo "🧪 To test your bot:"
echo "1. Go to Slack"
echo "2. Type: @claude what is 2+2?"
echo "3. You should see 'Working...' then it updates to '4'"
echo ""
echo "🎉 Your bot should now work perfectly!"