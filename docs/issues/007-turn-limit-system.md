# Issue #007: Dynamic Turn Limit System

**Status**: Implemented  
**Severity**: Enhancement  
**Date**: 2025-06  
**Impact**: Optimizes resource usage and improves task completion rates

## Summary

Implemented a precise, pattern-based turn limit system that dynamically allocates 15-50 conversation turns based on task complexity, with special focus on GitHub MCP operations requiring multiple tool calls.

## Background

Previously, all tasks received a fixed 15 turns regardless of complexity. This caused:
- Simple tasks wasting resources
- Complex tasks (like PR creation) failing to complete
- GitHub operations timing out due to multiple MCP tool calls
- No consideration for conversation context

## Solution

### Dynamic Turn Allocation

Base allocation of 15 turns with precise pattern matching:

| Pattern | +Turns | Reason |
|---------|--------|--------|
| GitHub MCP | +10 | 25+ tools available |
| PR/Issue ops | +10 | Multiple API calls needed |
| Major work | +10 | Features, migrations |
| Refactoring | +10 | System-wide changes |
| Debugging | +5 | Targeted fixes |
| Multi-step | +5 | Sequential operations |
| Deep analysis | +5 | Comprehensive review |
| Thread context | +5/+10 | Conversation history |

### Key Design Principles

1. **Precise Patterns**: Avoids false positives
   - ✅ "fix the bug" → debugging
   - ❌ "fix the typo" → no match

2. **Context-Aware**: Patterns require context
   - ✅ "refactor the system"
   - ❌ "refactor" alone

3. **GitHub-Focused**: PR creation involves:
   - Create branch → Commit files → Push → Create PR
   - Each step uses multiple MCP tools

## Implementation

### Files Modified
- `src/services/eventHandler.ts`: Added calculateTurns() method
- `src/services/githubDispatcher.ts`: Forward max_turns parameter
- `src/types/env.ts`: Added max_turns field
- `.github/workflows/claude-code-processor.yml`: Accept dynamic max_turns

Total: 68 lines added

### Example Calculations

```typescript
"hello" → 15 turns
"fix the bug" → 20 turns (15 + 5 debugging)
"create a PR" + GitHub → 35 turns (15 + 10 GitHub + 10 complex)
"first analyze then refactor and create PR" → 50 turns (capped)
```

## Results

- Simple tasks complete efficiently at 15 turns
- Complex GitHub operations get 35+ turns as needed
- Multi-step processes properly supported
- No false positives from common phrases
- All decisions logged for monitoring

## Monitoring

Every calculation logged:
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

## Lessons Learned

1. **Precision Matters**: Broad patterns cause false positives
2. **Context is Key**: "fix" alone is too ambiguous
3. **GitHub Complexity**: PR operations need significant turns
4. **Balance Required**: Too few turns = incomplete, too many = waste
5. **Logging Essential**: Must track actual usage patterns