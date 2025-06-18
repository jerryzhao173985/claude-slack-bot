# Checkpoint System Test Cases

## Test 1: Basic Session ID Generation
**Setup**: User mentions bot in a thread
**Expected**: 
- Session ID generated as `s` + 11 hex chars (e.g., `s1a2b3c4d5e6`)
- Same thread always generates same session ID
- Session ID doesn't change across days

## Test 2: Session Continuation Same Day
**Steps**:
1. Start task: "@claude analyze this large codebase"
2. Let it timeout or run out of turns
3. Check logs for checkpoint upload
4. Continue: "@claude continue"
**Expected**:
- Checkpoint found and loaded
- Task resumes from where it left off

## Test 3: Session Continuation Next Day
**Steps**:
1. Start task on Day 1
2. Let it timeout
3. Continue on Day 2: "@claude continue"
**Expected**:
- Same session ID generated (no date component)
- Checkpoint found and loaded
- Task resumes successfully

## Test 4: Explicit Session ID
**Steps**:
1. Start task, note session ID from logs
2. Let it timeout
3. Continue: "@claude continue session s1a2b3c4d5e6"
**Expected**:
- Provided session ID used
- Checkpoint found with exact match

## Test 5: Fallback Mechanism
**Steps**:
1. Create checkpoint with different naming
2. Try to resume
**Expected**:
- Primary download fails
- Fallback searches all artifacts
- Finds and downloads matching checkpoint

## Test 6: No Session ID Provided
**Steps**:
1. Start new task without thread context
**Expected**:
- SESSION_ID set to github.run_id
- No "resuming session" indicator shown

## Test 7: Auto-Continuation Detection
**Steps**:
1. Bot says "I've completed X. To finish Y, just say 'continue'."
2. User says "continue"
**Expected**:
- Auto-continuation detected
- Session ID generated from thread
- Previous work resumed

## Test 8: Checkpoint Content Verification
**Check checkpoint JSON contains**:
- Correct session_id (from outputs/session_id.txt)
- Current phase and progress
- Completed tasks
- Pending tasks
- Original request context

## Test 9: Error Handling
**Steps**:
1. Claude API fails during processing
**Expected**:
- Error message includes session ID
- User can retry with "@claude continue"
- Session ID remains consistent

## Test 10: Multiple Checkpoints
**Steps**:
1. Run task that creates checkpoints every 5 minutes
2. Check artifact storage
**Expected**:
- Only latest checkpoint kept (same artifact name)
- Each save overwrites previous
- Session ID remains constant

## Verification Commands

### Check Session ID Generation
```bash
# In eventHandler.ts logs
grep "Generated session ID" logs
grep "Using extracted session ID" logs
```

### Check Checkpoint Upload
```bash
# In workflow logs
grep "Upload checkpoint artifacts" logs
grep "Artifact checkpoint-" logs
```

### Check Checkpoint Download
```bash
# In workflow logs
grep "Download previous checkpoint" logs
grep "Found matching checkpoint" logs
grep "No matching checkpoint found" logs
```

### Check Session Consistency
```bash
# Verify SESSION_ID environment variable
grep "SESSION_ID=" logs
grep "Starting new session with ID" logs
grep "Resuming session" logs
```

## Common Issues to Watch For

1. **Session ID Format Mismatch**
   - EventHandler generates: `s1a2b3c4d5e6`
   - Workflow uses run_id: `1234567890`
   - Should handle both formats

2. **Checkpoint Not Found**
   - Check artifact name matches exactly
   - Verify SESSION_ID is set before download
   - Check retention period (7 days)

3. **Cross-Day Continuation**
   - Must work without date in session ID
   - Thread-based ID should be consistent

4. **Environment Variable Timing**
   - SESSION_ID must be set before any usage
   - Check step ordering in workflow

5. **Artifact Permissions**
   - Ensure GH_TOKEN has artifact read/write access
   - Check repository settings