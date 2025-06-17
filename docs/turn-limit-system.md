# Turn Limit System

## Overview

The Claude Code SDK automatically adjusts conversation turn limits based on task complexity. This ensures simple tasks complete quickly while complex tasks get sufficient resources.

## How It Works

### Base Allocation: 15 turns
All tasks start with 15 turns, sufficient for simple queries like "what time is it?" or "explain this code".

### Automatic Adjustments (Precise Patterns)

| Pattern | Additional Turns | Matches | Does NOT Match |
|---------|-----------------|---------|----------------|
| **GitHub MCP** | +10 | When GitHub tools loaded | - |
| **GitHub Complex** | +10 | `create a PR`, `open an issue`, `merge pull request`, `push to branch` | `create a note`, `open file` |
| **Major Work** | +10 | `implement new feature`, `build API`, `migrate to X`, `redesign system` | `implement fix`, `build docs` |
| **Refactoring** | +10 | `refactor the system/API/codebase` | `refactor` alone |
| **Debugging** | +5 | `fix the bug/error/crash`, `debug the issue` | `fix formatting`, `fix typo` |
| **Multi-step** | +5 | `first X then Y`, `step 1... step 2` | - |
| **Deep Analysis** | +5 | `analyze entire codebase/system` | `analyze this`, `analyze function` |
| **Thread >5 msgs** | +5 | Continuing conversation | - |
| **Thread >15 msgs** | +5 more | Long conversation (total +10) | - |

**Maximum cap: 50 turns**

## Examples

### Simple Queries (15 turns)
```
@claude What time is it?
@claude Explain this function
@claude Add a comment here
@claude Find a test file
```
These get only base turns - no patterns match.

### Bug Fix (20 turns)
```
@claude Fix the bug in auth.js
@claude Debug the error in login
```
- Base: 15
- Debugging (bug/error): +5
- Total: 20 turns

### GitHub PR Creation (35 turns)
```
@claude Create a PR with these changes
@claude Open an issue about this bug
```
- Base: 15
- GitHub MCP: +10
- GitHub Complex: +10
- Total: 35 turns

### Major Development (35 turns)
```
@claude Implement new authentication feature
@claude Build the payment API
```
- Base: 15
- GitHub MCP: +10 (if repo context)
- Major Work: +10
- Total: 35 turns

### Complex Multi-Step (45+ turns)
```
@claude First analyze the system, then refactor the API and create a PR
```
- Base: 15
- GitHub MCP: +10
- Multi-step: +5
- Refactoring: +10
- GitHub Complex: +10
- Total: 50 turns (capped)

## Key Design Principles

1. **Precise Patterns**: Only specific phrases trigger extra turns
   - ✅ "fix the bug" → Debugging (+5)
   - ❌ "fix the typo" → No match

2. **Context-Aware**: Patterns require context
   - ✅ "refactor the system" → Refactoring (+10)
   - ❌ "refactor" alone → No match

3. **GitHub-Focused**: PR/issue operations are complex
   - Creating PRs involves: create branch → commit → push → PR API
   - Each operation uses multiple MCP tools

4. **No False Positives**: Common words don't trigger extras
   - "find a test", "add to list", "review docs" → Base 15 turns

## Technical Implementation

Located in `src/services/eventHandler.ts`:

```typescript
private calculateTurns(text: string, mcpTools: string[], threadLength: number): number
```

The function:
1. Starts with base 15 turns
2. Adds 10 if GitHub MCP is loaded
3. Tests against precise regex patterns
4. Adds turns for matching patterns
5. Considers thread length
6. Caps at 50 maximum
7. Logs all decisions

## Monitoring

Every calculation is logged:
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

Monitor these logs to:
- Track which patterns match most often
- Verify turn utilization
- Identify potential adjustments
- Ensure no false positives