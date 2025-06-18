# Tool Call Best Practices for Claude Code SDK

## Overview

This document explains how to avoid common tool call errors in Claude Code SDK, particularly the "tool_use ids were found without tool_result blocks" error that occurs when tool calls are not properly paired with their results.

## Understanding the Error

### What Causes It

The error occurs when:
1. Claude makes multiple tool calls without waiting for results
2. Duplicate tool calls are made for the same resource
3. The message structure violates API requirements

Example of problematic behavior:
```
tool_use: toolu_01ABC... (fetch README.md)
tool_use: toolu_01DEF... (fetch README.md again) ❌
tool_use: toolu_01GHI... (fetch package.json)
```

The API expects:
```
tool_use: toolu_01ABC... (fetch README.md)
tool_result: toolu_01ABC... (content of README.md)
tool_use: toolu_01GHI... (fetch package.json)
tool_result: toolu_01GHI... (content of package.json)
```

## Best Practices

### 1. Track Tool Calls

**DO:**
- Keep a mental list of files already fetched
- Reuse content from previous reads
- Check conversation history before making calls

**DON'T:**
- Make duplicate calls for the same file
- Forget what you've already fetched
- Make unnecessary repeated calls

### 2. Batch Tool Calls Efficiently

**Good Pattern:**
```yaml
# Make multiple reads in a single response
- Read README.md
- Read package.json
- Read src/index.js
# All in one tool call batch
```

**Bad Pattern:**
```yaml
# Separate responses for each read
Response 1: Read README.md
Response 2: Read README.md again
Response 3: Read package.json
```

### 3. Announce Tool Usage

Before making tool calls, announce your intentions:
```
"I'll need to read the following files to understand the codebase:
- README.md for project overview
- package.json for dependencies
- src/index.js for entry point

Let me fetch these files now..."
[Make all three tool calls together]
```

### 4. Cache and Reuse

Once you've fetched content, cache it mentally:
```
✓ README.md - Contains project setup instructions
✓ package.json - Has React 18.2.0 and TypeScript 5.0
✓ src/index.js - Entry point with App component

# Later in conversation:
"As I saw in README.md earlier..." (don't re-fetch)
```

### 5. Handle Complex Operations

For operations that might trigger multiple tool calls:

1. **Save checkpoint first**
   ```
   "I'm about to analyze multiple files. Let me save a checkpoint first..."
   ```

2. **Plan the sequence**
   ```
   "To implement this feature, I'll need:
   1. Current implementation (src/feature.js)
   2. Test file (tests/feature.test.js)
   3. Configuration (config/settings.json)"
   ```

3. **Execute in batch**
   ```
   [Make all three reads in one response]
   ```

## Common Scenarios

### Scenario 1: Code Analysis

**Inefficient (causes errors):**
```
1. Read README.md
2. "I need to check something in README.md again" → Read README.md
3. Read src/index.js
4. "Let me verify the README.md setup" → Read README.md
```

**Efficient (no errors):**
```
1. Read README.md, src/index.js, package.json (batch)
2. Use cached content for all subsequent references
```

### Scenario 2: File Updates

**Before updating files:**
```
1. Check if file exists (list directory)
2. Read current content ONCE
3. Make modifications in memory
4. Use appropriate update tool (push_files for existing, create_or_update_file for new)
```

### Scenario 3: Repository Analysis

**For GitHub repositories:**
```
1. Announce: "I'll analyze the repository structure"
2. Batch calls:
   - Get repository info
   - List main directory
   - Read key files (README, package.json, etc.)
3. Cache all results
4. Refer to cached data for analysis
```

## Error Recovery

If you encounter the tool pairing error:

1. **User sees:** Specific error message about tool usage
2. **Recovery:** User can say "@claude continue"
3. **Next attempt:** Be more careful with tool usage
4. **Prevention:** Follow batching and caching practices

## Configuration in Workflows

The workflows now include these preventive measures:

```yaml
# In claude-code-processor-best.yml
### CRITICAL: Tool Call Best Practices to Prevent Errors
1. Track Your Tool Calls
2. Batch Tool Calls Efficiently
3. Before Any Tool Call (check if already fetched)
4. Tool Call Sequence Rules
5. File Reading Guidelines
```

## Debugging Tool Call Issues

To debug tool call problems:

1. **Check execution logs:**
   ```bash
   grep "tool_use" /home/runner/work/_temp/claude-execution-output.json
   ```

2. **Look for patterns:**
   - Multiple identical tool_use IDs
   - Missing tool_result blocks
   - Duplicate file fetches

3. **Review conversation flow:**
   - Ensure each tool_use has a result
   - Check for repeated operations
   - Verify batching is used

## Summary

The key to avoiding tool call errors:
1. **Never duplicate** - Each file read once per session
2. **Batch operations** - Multiple reads in one response
3. **Cache mentally** - Remember what you've fetched
4. **Plan ahead** - Announce multi-file operations
5. **Check first** - Verify if content already available

Following these practices will significantly reduce tool pairing errors and improve the reliability of Claude Code SDK operations.