# Testing GitHub File Operations

## Test Scenarios to Verify SHA Fix

### Test 1: Create New File (Should Work)
```
@claude create a new file test-new-file.txt in my repo with content "This is a test"
```
Expected: Should use `create_or_update_file` and succeed

### Test 2: Update Existing File (Should Use push_files)
```
@claude update the README.md file to fix a typo
```
Expected: Should use `push_files` and succeed

### Test 3: Multiple Files (Should Use push_files)
```
@claude update both package.json and README.md files
```
Expected: Should use `push_files` for batch operation

### Test 4: Explicit Update Request
```
@claude I need to update an existing configuration file config.json
```
Expected: Should recognize "existing" and use `push_files`

## Monitoring Success

1. **Check Workflow Duration**: Should complete in < 2 minutes (not timeout at 10)
2. **Check Logs**: Should NOT see "sha wasn't supplied" error
3. **Check Tool Usage**: Should see `push_files` for existing files
4. **Check Result**: Files should be successfully updated

## If Issues Persist

1. **Check Tool Names**: Ensure exact match (case-sensitive)
2. **Check Permissions**: Ensure GitHub token has write access
3. **Check Branch**: Ensure branch exists and is not protected
4. **Check Claude's Logic**: Review what tool Claude chose and why

## Expected Behavior

- Claude should now make intelligent decisions about which tool to use
- No more 10-minute timeouts on file updates
- Clear reasoning in Claude's response about tool choice
- Successful file operations without SHA errors