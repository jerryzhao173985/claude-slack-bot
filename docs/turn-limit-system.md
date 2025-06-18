# Turn Limit & Dynamic Timeout System

## Overview

The Claude Slack Bot uses an intelligent system to allocate conversation turns and calculate timeouts based on task complexity. This ensures optimal resource usage and reliable task completion.

## Turn Allocation System

### Base Allocation
- **Default**: 15 turns for simple queries
- **Maximum**: 50 turns for complex tasks

### Complexity Markers

The system analyzes your request for specific patterns to determine complexity:

#### 1. **GitHub Operations** (+10 turns)
- Triggered when GitHub MCP tools are loaded
- Examples: "analyze repository", "create PR", "review code"

#### 2. **Multi-Step Tasks** (+5 turns)
- Pattern: `first...then`, `step 1...step 2`
- Examples: "First analyze the code, then create a fix"

#### 3. **Refactoring** (+10 turns)
- Pattern: `refactor the entire system/codebase/architecture`
- Major architectural changes

#### 4. **GitHub Complex Operations** (+10 turns)
- Pattern: `create/open/submit/merge PR/issue`
- Examples: "create a pull request", "open an issue"

#### 5. **Major Development** (+10 turns)
- Pattern: `implement/build/develop feature/system/api`
- Examples: "implement new authentication system"

#### 6. **Debugging** (+5 turns)
- Pattern: `debug/fix/resolve bug/issue/error`
- Examples: "fix the login bug"

#### 7. **Comprehensive Analysis** (+5 turns)
- Pattern: `analyze entire codebase/system`
- Full system analysis

#### 8. **Contextual References** (+15 turns)
- Short messages like "do it", "continue" in threads
- Refers to complex tasks mentioned earlier

#### 9. **Thread Context**
- +5 turns for threads with 5+ messages
- +10 turns total for threads with 15+ messages

## Dynamic Timeout Calculation

### Base Formula
```
Base Timeout = (turns × 30 seconds) + 5 minute buffer
```

### Task Multipliers

1. **GitHub Write Operations**: 1.5x
   - Creating PRs, pushing code, updating issues

2. **File Operations**: 1 + (0.2 × estimated_files)
   - More files = more time needed

3. **Deep Analysis**: 1.3x
   - Comprehensive code reviews, security audits

4. **MCP Tool Usage**: 1 + (0.1 × tool_count)
   - Each additional tool adds complexity

### Maximum Timeout
- **Cap**: 45 minutes (leaving 15-minute buffer for GitHub's 60-minute limit)

## Examples

### Simple Query
```
@claude explain this function
```
- **Turns**: 15
- **Timeout**: 10 minutes

### Bug Fix
```
@claude fix the authentication error in login.js
```
- **Turns**: 20 (+5 for debugging)
- **Timeout**: 15 minutes

### Feature Implementation
```
@claude implement user profile feature with avatar upload
```
- **Turns**: 25 (+10 for major work)
- **Timeout**: 20 minutes

### Complex Multi-Step with GitHub
```
@claude analyze the entire codebase, fix security issues, and create a PR
```
- **Turns**: 45 (+10 GitHub, +5 analysis, +10 GitHub complex, +5 multi-step)
- **Timeout**: 35-40 minutes (with multipliers)

### Thread Continuation
```
[Previous messages discussing complex refactoring]
User: do it
```
- **Turns**: 40+ (+15 for contextual reference, +thread bonuses)
- **Timeout**: 30-35 minutes

## Session Management

### Automatic Continuation
When a task exceeds time limits:

1. **Progress Saved**: Checkpoint created with completed/pending work
2. **Clear Message**: Bot explains what was done and what remains
3. **Easy Resume**: User can simply say "continue" to resume

### Checkpoint Contents
```json
{
  "phase": "implementation",
  "progress_percentage": 75,
  "completed": {
    "files_created": ["auth.js", "profile.js"],
    "analysis_complete": true
  },
  "pending": {
    "steps": ["Create PR", "Add tests"],
    "estimated_turns": 10
  }
}
```

## Best Practices

1. **Be Specific**: More detailed requests get better resource allocation
2. **Use Threads**: Continuing in threads preserves context
3. **Trust the System**: Don't worry about manual session management
4. **"Continue" Works**: Simple continuation commands are recognized

## Resource Monitoring

The bot monitors resource usage and will:
- At 70%: Start consolidating work
- At 80%: Focus on critical items only
- At 90%: Save all work immediately
- At 95%: Emergency save with continuation instructions

This ensures your work is never lost, even for the most complex tasks.