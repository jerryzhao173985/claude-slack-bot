# Complete Checkpoint System Implementation

## Overview

The checkpoint system enables Claude to save progress and resume interrupted tasks. This is critical for handling:
- GitHub Actions timeout (10-45 minutes)
- Claude turn limits (15-50 turns)
- API failures or overload errors

## Session ID Architecture

### Two Types of Session IDs

1. **Thread-based Session ID** (prefix: `s`)
   - Format: `s` + 11 hex characters (e.g., `s1a2b3c4d5e6`)
   - Generated from: hash of `channel-threadTs`
   - Used when: Message is in a thread or continuation detected
   - Persistent: Same thread always generates same ID
   - Cross-day: Works across multiple days

2. **Run-based Session ID** (prefix: `r`)
   - Format: `r` + numeric run ID (e.g., `r1234567890`)
   - Generated from: GitHub Actions run ID
   - Used when: No thread context available
   - Unique: Each workflow run gets new ID

### Why Two Types?

- **Thread-based**: Allows natural continuation in Slack threads
- **Run-based**: Fallback for standalone messages
- **Prefixes**: Distinguish between types for debugging

## Implementation Details

### 1. EventHandler (Slack Bot)

```typescript
// Session ID generation (eventHandler.ts)
private generateSessionId(channel: string, threadTs: string): string {
  const data = `${channel}-${threadTs}`; // No date component!
  // ... hash generation ...
  return 's' + Math.abs(hash).toString(16).padStart(11, '0').substring(0, 11);
}
```

Key improvements:
- Removed date from hash (was breaking cross-day continuation)
- Added 's' prefix to distinguish from run IDs
- Deterministic: Same thread = same ID

### 2. GitHub Workflow

```bash
# Session ID setup (workflows)
SESSION_ID="${{ github.event.inputs.session_id }}"
if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  SESSION_ID="r${{ github.run_id }}"  # Prefix with 'r'
fi
echo "$SESSION_ID" > outputs/session_id.txt
echo "SESSION_ID=$SESSION_ID" >> $GITHUB_ENV
```

Key improvements:
- Consistent use of environment variable
- Validation of session ID format
- Clear logging for debugging

### 3. Checkpoint Artifacts

```yaml
# Download (with fallback)
- name: Download previous checkpoint
  uses: actions/download-artifact@v4
  with:
    name: checkpoint-${{ env.SESSION_ID }}

# Upload (always same name)
- name: Upload checkpoint artifacts
  uses: actions/upload-artifact@v4
  with:
    name: checkpoint-${{ env.SESSION_ID }}
```

Key improvements:
- Both use `env.SESSION_ID` (not input directly)
- Fallback mechanism searches all artifacts
- 7-day retention for checkpoints

## Claude's Checkpoint Instructions

### When to Save Checkpoints
1. Every 5 minutes (time-based)
2. Every 10-15 turns (not 5 - too frequent)
3. After completing major phases
4. BEFORE risky operations (not after)
5. When detecting complex operations ahead
6. At 50% of allocated time
7. When completing tasks

### Checkpoint Format
```json
{
  "session_id": "[from outputs/session_id.txt]",
  "timestamp": "2025-01-18T12:00:00Z",
  "phase": "implementation",
  "progress_percentage": 75,
  "completed": {
    "files_modified": ["file1.ts", "file2.ts"],
    "analysis_complete": true
  },
  "pending": {
    "steps": ["Create PR", "Run tests"],
    "estimated_turns": 5
  },
  "context": {
    "original_request": "...",
    "key_findings": "...",
    "partial_work": "..."
  }
}
```

## User Experience Flow

### Starting a Task
1. User: "@claude analyze this repository"
2. Bot shows: "🤔 Working on your request..."
3. EventHandler generates session ID from thread
4. Workflow receives and uses consistent session ID

### Task Interruption
1. Claude saves checkpoint before timeout
2. Writes partial response to file
3. Workflow uploads checkpoint artifact
4. User sees completed work + continuation hint

### Resuming a Task
1. User: "@claude continue" (in same thread)
2. EventHandler generates same session ID (deterministic)
3. Workflow downloads checkpoint successfully
4. Claude loads state and continues

## Error Handling

### API Failures
- Error message includes session ID
- User can retry with "@claude continue"
- Session state preserved

### Checkpoint Not Found
1. Primary download tried first
2. Fallback searches all artifacts
3. Downloads any matching checkpoint
4. Graceful degradation if none found

## Testing Verification

### Key Scenarios to Test
1. **Same-day continuation**: Works ✓
2. **Next-day continuation**: Works ✓ (no date in hash)
3. **Explicit session ID**: Works ✓
4. **No thread context**: Uses run ID ✓
5. **API failure recovery**: Preserves session ✓

### Debug Commands
```bash
# Check session generation
grep "Generated session ID" logs
grep "SESSION_INFO:" logs

# Check checkpoint lifecycle
grep "checkpoint-[sr]" logs
grep "Upload.*artifact" logs
```

## Common Issues Resolved

1. **"Artifact not found"**
   - Fixed: Consistent SESSION_ID usage
   - Fixed: Fallback search mechanism

2. **Cross-day continuation fails**
   - Fixed: Removed date from session hash

3. **Session ID format mismatch**
   - Fixed: Added prefixes (s/r)
   - Fixed: Format validation

4. **Timeout at 10 minutes**
   - Fixed: Proper timeout_minutes passing
   - Fixed: Default increased to 30

## Best Practices

1. **Always use thread context** when possible (enables better continuation)
2. **Monitor checkpoint saves** in logs
3. **Include clear next steps** in checkpoint context
4. **Save partial work** immediately when approaching limits
5. **Test continuation** across days for long-running tasks

The checkpoint system is now robust and handles all major edge cases for reliable task continuation.