# Long-Running Task Management

This document describes how the Claude Slack bot handles long-running tasks with session management and progress checkpointing.

## Features

### 1. Dynamic Timeout Allocation

The bot automatically adjusts workflow timeouts based on task complexity:

- **Base (15-20 turns)**: 10 minutes
- **Complex (21-30 turns)**: 15 minutes  
- **Very Complex (31-40 turns)**: 20 minutes
- **Extremely Complex (40+ turns)**: 30 minutes

### 2. Progress Checkpointing

For complex tasks, Claude saves progress every 5-10 turns to `outputs/checkpoints/progress.json`:

```json
{
  "timestamp": "2025-06-17T10:30:00Z",
  "completed_steps": ["Analyzed repository structure", "Found 3 security issues"],
  "pending_steps": ["Create PR with fixes", "Update documentation"],
  "current_status": "Working on security fixes",
  "findings": {"security_issues": 3, "files_analyzed": 42}
}
```

### 3. Session Resumption

Users can continue interrupted tasks using session IDs:

```
@claude continue session abc123-def456
```

The bot will:
1. Detect the session ID in the message
2. Show "(resuming session)" in the placeholder
3. Load previous checkpoints
4. Continue from where it left off

### 4. Automatic Continuation Hints

When a task runs out of turns, the bot:
1. Saves the current state and session ID
2. Posts a continuation message with pending steps
3. Provides the exact command to resume

Example continuation message:
```
ℹ️ Task partially completed. To continue with remaining steps, mention me with: `continue session abc123-def456`

Pending steps:
- Create PR with fixes
- Update documentation
```

## Implementation Details

### Turn Calculation

The `calculateTurns` method analyzes:
- Task complexity markers (refactoring, GitHub operations, etc.)
- Thread context length
- Continuation requests
- Short messages in threads (likely continuations)

### Session ID Patterns

The bot recognizes these patterns:
- `continue session [id]`
- `resume session [id]`
- `session [id]`

### Workflow Parameters

New workflow inputs:
- `timeout_minutes`: Dynamic timeout based on complexity
- `session_id`: For resuming previous conversations
- `enable_checkpointing`: Always enabled by default

## Best Practices

1. **For Users**:
   - Use descriptive initial requests to get accurate turn allocation
   - Save the session ID when working on complex tasks
   - Use "continue session" to resume interrupted work

2. **For Complex Tasks**:
   - The bot automatically detects complexity and adjusts resources
   - Progress is saved periodically
   - Partial results are always saved before timeout

3. **For Developers**:
   - Monitor the turn allocation logs
   - Check checkpoint files for debugging
   - Session IDs are UUID format for easy tracking