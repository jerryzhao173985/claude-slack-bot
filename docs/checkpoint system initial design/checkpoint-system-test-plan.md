# Checkpoint System Test Plan

## Test Scenarios

### 1. **Session ID Exact Match**
- Start a task with session `s000082b749f`
- Task completes/fails, saves checkpoint
- Continue with same session ID
- **Expected**: Strategy 1 finds exact match immediately

### 2. **Session ID Type Mismatch**
- Start a task without thread context → creates `checkpoint-r15749536247`
- Continue in same thread → generates `s000082b749f`
- **Expected**: Strategy 2 finds checkpoint by thread_ts match

### 3. **Version Compatibility**
- Load v1.0 checkpoint (no thread_ts)
- **Expected**: Shows "Version 1.0 - thread verification not available"
- Load v1.1 checkpoint
- **Expected**: Thread verification works
- Load v1.2 checkpoint
- **Expected**: Full metadata displayed

### 4. **No Matching Checkpoint**
- Continue in a new thread with no previous checkpoints
- **Expected**: No checkpoint found, fresh start

### 5. **Multiple Checkpoints**
- Have 3+ checkpoints from different threads
- Continue in one specific thread
- **Expected**: Strategy 2 finds the correct checkpoint by thread match

### 6. **Fallback Scenario**
- No exact match, no thread match
- **Expected**: Strategy 3 uses most recent checkpoint with warning

## Verification Steps

### Before Each Test
```bash
# Check existing artifacts
gh api repos/jerryzhao173985/claude-slack-bot/actions/artifacts | \
  jq '.artifacts[] | select(.name | startswith("checkpoint-")) | .name'
```

### During Test
Watch the workflow logs for:
1. "=== Checkpoint Discovery ==="
2. Which strategy succeeded
3. Checkpoint metadata display
4. Thread verification results

### After Test
Verify Claude:
1. Loaded the correct checkpoint
2. Has access to previous context
3. Continues from the right point

## Debug Commands

### List All Checkpoints
```bash
gh api repos/jerryzhao173985/claude-slack-bot/actions/artifacts --paginate | \
  jq -r '.artifacts[] | select(.name | startswith("checkpoint-")) | 
  "\(.name) - \(.created_at) - \(.size_in_bytes) bytes"' | sort
```

### Download and Inspect Checkpoint
```bash
# Download specific checkpoint
ARTIFACT_ID=123456789
gh api repos/jerryzhao173985/claude-slack-bot/actions/artifacts/$ARTIFACT_ID/zip \
  -H "Accept: application/vnd.github+json" > checkpoint.zip

# Extract and view
unzip checkpoint.zip
cat progress.json | jq .
```

### Check Thread Match
```bash
# Compare thread_ts in checkpoint with current thread
jq -r '.thread_ts' progress.json
```

## Common Issues and Solutions

### Issue: "Artifact not found"
- **Cause**: Cross-run artifacts require GitHub API
- **Solution**: This is expected, fallback handles it

### Issue: Wrong checkpoint loaded
- **Cause**: Thread mismatch or no thread_ts in old version
- **Solution**: Check Strategy 2 output for thread verification

### Issue: Checkpoint too old
- **Cause**: Artifacts expire after 7 days
- **Solution**: Check expiration dates in checkpoint list

### Issue: API rate limit
- **Cause**: Too many checkpoint checks
- **Solution**: Limit to 5 most recent checkpoints

## Success Criteria

✅ No more "Unable to download artifact" errors (it's expected behavior)
✅ Thread-based search finds correct checkpoint
✅ Version differences handled gracefully
✅ Clear logging shows what happened
✅ Claude successfully continues from checkpoint