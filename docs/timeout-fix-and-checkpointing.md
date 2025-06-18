# Timeout Fix and Checkpointing Enhancement

## Problem Fixed

Claude was being killed after exactly 10 minutes despite actively working on complex tasks like PR reviews. This happened because:

1. The `timeout_minutes` parameter wasn't being passed to the Claude action
2. The default timeout (10 minutes) was too short for complex tasks
3. Checkpointing was happening too late

## Solutions Implemented

### 1. Dynamic Timeout Now Working

**Before**: Claude action used default 10-minute timeout
**After**: Dynamic timeout from Cloudflare Worker is properly passed to Claude

```yaml
# In claude-code-processor-best.yml
max_turns: ${{ github.event.inputs.max_turns || '15' }}
timeout_minutes: ${{ github.event.inputs.timeout_minutes || '30' }}  # NEW!
claude_env: ${{ steps.claude-config.outputs.claude_env }}
```

### 2. Improved Timeout Calculation

- **Minimum**: 20 minutes (was no minimum)
- **Default**: 30 minutes (was 10)
- **Maximum**: 45 minutes (unchanged)
- **Buffer**: 10 minutes (was 5)

### 3. PR Review Detection

Added specific detection for PR review tasks which automatically:
- Adds 30 complexity points
- Assumes at least 5 files will be modified
- Ensures adequate timeout allocation

### 4. Enhanced Checkpointing

Claude now saves checkpoints:
- **Every 5 minutes** (time-based)
- **Every 5 turns** (progress-based)
- **BEFORE** starting GitHub operations (not after)
- **At 50%** of allocated time
- **Immediately** when detecting complex operations ahead

### 5. Partial Work Handling

If approaching timeout, Claude will:
1. Save current work state to checkpoint
2. Write partial response to `outputs/slack_response.txt`
3. Include what was completed and what remains

## How It Works Now

1. **User requests PR review** → Detected as complex task
2. **Cloudflare Worker calculates timeout** → e.g., 35 minutes for PR review
3. **Timeout passed to Claude action** → Claude gets full 35 minutes
4. **Claude saves frequent checkpoints** → Every 5 minutes/turns
5. **If interrupted** → Can resume from checkpoint

## Best Practices

### For Complex Tasks
- PR reviews automatically get minimum 30 minutes
- Multiple file operations get extra time
- Deep analysis tasks get complexity multiplier

### For Resumption
- Session ID is automatically generated for threads
- Users can say "continue" to resume
- Checkpoints preserve all progress

### For Safety
- Workflow timeout is same as Claude timeout
- Buffer time ensures graceful shutdown
- Partial responses are always saved

## Testing

To verify the fix works:
1. Request a complex PR review
2. Check logs for "Dynamic timeout calculated"
3. Verify Claude runs beyond 10 minutes
4. Check that checkpoints are saved frequently

The system now handles complex tasks properly without timing out prematurely!