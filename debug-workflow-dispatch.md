# Debugging GitHub Workflow Dispatch Issue

## Problem
Slack bot requests are NOT triggering the GitHub Action workflow. The bot was working with `claude-code-processor-ultimate.yml` but stopped after renaming to `claude-code-processor.yml`.

## Key Findings

1. **Configuration is correct**:
   - `wrangler.toml` has correct `GITHUB_WORKFLOW_FILE = "claude-code-processor.yml"`
   - Workflow file exists at `.github/workflows/claude-code-processor.yml`
   - Code correctly dispatches to the workflow

2. **Likely Issue: Missing GITHUB_TOKEN in Cloudflare Worker**
   - The `githubDispatcher.ts` uses `this.env.GITHUB_TOKEN` to authenticate
   - This token must be set as a Cloudflare Worker secret

## Solution Steps

### Step 1: Verify GitHub Token in Cloudflare
```bash
# Check if GITHUB_TOKEN is set in Cloudflare Worker
wrangler secret list

# If GITHUB_TOKEN is not listed, add it:
wrangler secret put GITHUB_TOKEN
# Enter your GitHub personal access token when prompted
```

### Step 2: Test GitHub Dispatch Locally
```bash
# Set your GitHub token as environment variable
export GITHUB_TOKEN="your-github-pat-token"

# Run the test script
npx tsx test-github-dispatch.ts
```

### Step 3: Check Cloudflare Worker Logs
```bash
# Tail the worker logs to see errors
wrangler tail
```

### Step 4: Verify GitHub Token Permissions
Your GitHub personal access token needs:
- `repo` scope (full control of private repositories)
- `workflow` scope (update GitHub Action workflows)

To create a new token:
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` and `workflow` scopes
3. Update both locations:
   - GitHub repository secret: `GH_TOKEN`
   - Cloudflare Worker secret: `GITHUB_TOKEN`

### Step 5: Debug in Production
Add error logging to see the actual error:

```typescript
// In githubDispatcher.ts, update the error handling:
if (!response.ok) {
  const error = await response.text();
  console.error('GitHub API Response:', {
    status: response.status,
    statusText: response.statusText,
    error: error,
    url: url,
    headers: response.headers
  });
  throw new Error(`GitHub API error: ${response.status} - ${error}`);
}
```

### Step 6: Check GitHub Actions Settings
Ensure your repository allows workflow dispatch:
1. Go to your repository Settings > Actions > General
2. Under "Workflow permissions", ensure "Read and write permissions" is selected
3. Check "Allow GitHub Actions to create and approve pull requests" if needed

### Step 7: Verify Workflow File Name
The GitHub API is case-sensitive. Ensure:
- The actual file is named `claude-code-processor.yml` (not `.yaml`)
- The `GITHUB_WORKFLOW_FILE` in `wrangler.toml` matches exactly

### Common Issues & Solutions

1. **404 Not Found**: Workflow file name doesn't match or doesn't exist
2. **401 Unauthorized**: GitHub token is missing or invalid
3. **403 Forbidden**: Token lacks required permissions
4. **422 Unprocessable Entity**: Invalid workflow inputs or ref

## Testing Workflow Dispatch Manually

You can test the workflow dispatch directly from GitHub:
1. Go to Actions tab in your repository
2. Select "Claude Code Processor" workflow
3. Click "Run workflow"
4. Fill in test values
5. Click "Run workflow" button

If manual dispatch works but API dispatch doesn't, it's likely a token/permission issue.

## Quick Fix Checklist

- [ ] GITHUB_TOKEN is set in Cloudflare Worker secrets
- [ ] GitHub PAT has `repo` and `workflow` scopes
- [ ] Workflow file name matches exactly in wrangler.toml
- [ ] Repository allows workflow dispatch
- [ ] Worker is deployed with latest code: `npm run deploy`