# Turn Limit System - Implementation Summary

## Overview

Implemented a precise, pattern-based turn limit system that dynamically allocates 15-50 turns based on task complexity, with special focus on GitHub MCP operations.

## Implementation Details

### 1. Core Logic
Added `calculateTurns()` method to `src/services/eventHandler.ts`:
- Base: 15 turns (all tasks)
- Maximum: 50 turns (hard cap)
- Uses precise regex patterns to avoid false positives

### 2. Turn Allocations

| Pattern | +Turns | Examples | Won't Match |
|---------|--------|----------|-------------|
| **GitHub MCP** | +10 | When GitHub tools loaded | - |
| **GitHub Complex** | +10 | `create a PR`, `open issue`, `merge PR` | `create note` |
| **Major Work** | +10 | `implement new feature`, `migrate to X` | `implement fix` |
| **Refactoring** | +10 | `refactor the system/API` | `refactor` alone |
| **Debugging** | +5 | `fix the bug/error`, `debug issue` | `fix typo` |
| **Multi-step** | +5 | `first X then Y` | - |
| **Deep Analysis** | +5 | `analyze entire codebase` | `analyze this` |
| **Thread Context** | +5/+10 | >5 msgs: +5, >15 msgs: +10 | - |

### 3. Files Modified

```
src/services/eventHandler.ts       | +53 lines (calculateTurns method)
src/services/githubDispatcher.ts   | +1 line (max_turns parameter)  
src/types/env.ts                   | +1 line (max_turns field)
.github/workflows/claude-code-processor.yml | +13 lines (max_turns input)
```

Total: 68 lines added

### 4. Key Design Principles

1. **Precise Patterns**: Context-aware matching prevents false positives
2. **GitHub-Focused**: PR/issue operations need multiple MCP calls
3. **No Ambiguity**: "fix the bug" ≠ "fix the typo"
4. **Well-Logged**: Every decision tracked for monitoring

## Examples

```bash
# Simple (15 turns)
"What time is it?"
"Add a comment"
"Find a test"

# Moderate (20-25 turns)  
"Fix the bug in auth.js" → 20 turns
"Analyze the code" + GitHub → 25 turns

# Complex (35 turns)
"Create a PR with changes" → 35 turns
"Implement new API feature" → 35 turns
"Refactor the authentication system" → 35 turns

# Maximum (50 turns)
"First analyze, then refactor the system and create a PR" → 50 turns
```

## Monitoring

All calculations logged with:
```json
{
  "message": "Turn allocation calculated",
  "base": 15,
  "calculated": 35,
  "hasGitHub": true,
  "threadLength": 3,
  "patternsMatched": ["githubComplex", "refactoring"]
}
```

## Benefits

✅ **Precise**: No false positives from common words  
✅ **Efficient**: Simple tasks stay at 15 turns  
✅ **Complete**: Complex GitHub operations get 35+ turns  
✅ **Maintainable**: Only 68 lines of clean code  
✅ **Transparent**: Clear rules, easy to understand  

## Testing

Patterns tested to ensure:
- Common phrases don't trigger extras
- Complex operations get appropriate turns
- GitHub PR/issue operations properly recognized
- Multi-step processes detected accurately