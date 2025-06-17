# 🚀 Deployment Checklist

## IMPORTANT: After ANY Configuration Changes

When you change ANYTHING in the configuration (especially workflow names), you MUST:

### 1. Update Configuration Files
- [ ] Update `wrangler.toml` with new workflow name
- [ ] Ensure `.github/workflows/[name].yml` exists
- [ ] Run `./verify-deployment.sh` to check

### 2. Deploy to Cloudflare ⚠️ CRITICAL
```bash
npm run deploy
```

### 3. Verify Deployment
```bash
# Check what's deployed
wrangler deployments list

# Monitor live logs
wrangler tail
```

## Common Issues

### ❌ "Workflow not triggering"
**Cause**: Changed workflow name but didn't redeploy Worker
**Fix**: Run `npm run deploy`

### ❌ "404 on GitHub workflow dispatch"
**Cause**: Workflow file doesn't exist or name mismatch
**Fix**: Verify file exists and matches `wrangler.toml`

## Current Configuration
- Workflow: `claude-code-processor.yml`
- Last deployed: Just now ✅

## Quick Deploy Command
```bash
# One command to rule them all
git push && npm run deploy && wrangler tail
```

Remember: **Configuration changes require redeployment!**